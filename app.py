import os
import uuid
from flask import Flask, render_template, request, send_file, jsonify, url_for
from werkzeug.utils import secure_filename
from PIL import Image
import subprocess
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['COMPRESSED_FOLDER'] = 'compressed'
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size

# Allowed file extensions
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'webm', 'flv'}

# Create necessary directories
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['COMPRESSED_FOLDER'], exist_ok=True)

def allowed_image_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS

def allowed_video_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_VIDEO_EXTENSIONS

def get_file_size(filepath):
    """Get file size in human readable format"""
    size = os.path.getsize(filepath)
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size < 1024.0:
            return f"{size:.2f} {unit}"
        size /= 1024.0
    return f"{size:.2f} TB"

def compress_image(input_path, output_path, quality=85, max_width=None, max_height=None):
    """Compress and resize image"""
    try:
        with Image.open(input_path) as img:
            # Convert to RGB if necessary (for PNG with transparency)
            if img.mode in ('RGBA', 'LA', 'P'):
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = rgb_img
            
            # Resize if dimensions provided
            if max_width or max_height:
                original_width, original_height = img.size
                
                # Calculate new dimensions while maintaining aspect ratio
                if max_width and max_height:
                    ratio = min(max_width/original_width, max_height/original_height)
                elif max_width:
                    ratio = max_width/original_width
                elif max_height:
                    ratio = max_height/original_height
                
                new_width = int(original_width * ratio)
                new_height = int(original_height * ratio)
                
                if new_width < original_width or new_height < original_height:
                    img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Save compressed image
            img.save(output_path, 'JPEG' if output_path.lower().endswith(('.jpg', '.jpeg')) else 'PNG', 
                     quality=quality, optimize=True)
            
            return True
    except Exception as e:
        print(f"Error compressing image: {e}")
        return False

def compress_video(input_path, output_path, crf=28, max_width=None, max_height=None):
    """Compress and resize video using FFmpeg"""
    try:
        # Check if ffmpeg is available
        try:
            subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            return {"success": False, "error": "FFmpeg is not installed. Please install FFmpeg to compress videos."}
        
        # Build ffmpeg command
        cmd = ['ffmpeg', '-i', input_path, '-vcodec', 'libx264', '-crf', str(crf)]
        
        # Add resize filter if dimensions provided
        if max_width or max_height:
            scale_filter = 'scale='
            if max_width and max_height:
                scale_filter += f"{max_width}:{max_height}:force_original_aspect_ratio=decrease"
            elif max_width:
                scale_filter += f"{max_width}:-2"
            elif max_height:
                scale_filter += f"-2:{max_height}"
            
            cmd.extend(['-vf', scale_filter])
        
        cmd.extend(['-preset', 'medium', '-acodec', 'aac', '-y', output_path])
        
        # Run ffmpeg command
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            return {"success": False, "error": f"FFmpeg error: {result.stderr}"}
        
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload and return file info"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        file_type = request.form.get('file_type', 'image')
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file type
        if file_type == 'image' and not allowed_image_file(file.filename):
            return jsonify({'error': 'Invalid image format. Allowed: PNG, JPG, JPEG, GIF, BMP, WEBP'}), 400
        elif file_type == 'video' and not allowed_video_file(file.filename):
            return jsonify({'error': 'Invalid video format. Allowed: MP4, AVI, MOV, MKV, WEBM, FLV'}), 400
        
        # Generate unique filename
        file_ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{uuid.uuid4().hex}.{file_ext}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # Save file
        file.save(filepath)
        
        # Get file size
        file_size = get_file_size(filepath)
        
        return jsonify({
            'success': True,
            'filename': filename,
            'original_name': file.filename,
            'file_size': file_size,
            'file_type': file_type,
            'download_url': url_for('download_file', filename=filename, type='original')
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/compress', methods=['POST'])
def compress_file():
    """Compress uploaded file"""
    try:
        data = request.json
        filename = data.get('filename')
        file_type = data.get('file_type')
        quality = int(data.get('quality', 85))
        max_width = int(data.get('max_width', 0)) or None
        max_height = int(data.get('max_height', 0)) or None
        
        if not filename:
            return jsonify({'error': 'No filename provided'}), 400
        
        input_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        if not os.path.exists(input_path):
            return jsonify({'error': 'File not found'}), 404
        
        # Generate output filename
        file_ext = filename.rsplit('.', 1)[1].lower()
        output_filename = f"compressed_{uuid.uuid4().hex[:8]}.{file_ext}"
        output_path = os.path.join(app.config['COMPRESSED_FOLDER'], output_filename)
        
        original_size = os.path.getsize(input_path)
        
        # Compress based on file type
        if file_type == 'image':
            success = compress_image(input_path, output_path, quality, max_width, max_height)
            if not success:
                return jsonify({'error': 'Failed to compress image'}), 500
        else:  # video
            # ✅ FIXED CRF FORMULA
            # Convert quality percentage (10-100) to CRF (18-45)
            # Higher quality % = Lower CRF = Better quality, larger file
            # 100% quality → CRF 18 (visually lossless)
            # 85% quality → CRF 23 (default, good balance)
            # 70% quality → CRF 28 (good compression)
            # 50% quality → CRF 33 (high compression)
            # 10% quality → CRF 45 (maximum compression)
            crf = int(18 + (100 - quality) * 0.3)
            
            print(f"Video compression: quality={quality}%, CRF={crf}")
            
            result = compress_video(input_path, output_path, crf, max_width, max_height)
            if not result.get('success'):
                return jsonify({'error': result.get('error', 'Failed to compress video')}), 500
        
        # Get compressed file size
        compressed_size = os.path.getsize(output_path)
        compressed_size_str = get_file_size(output_path)
        
        # Calculate compression ratio
        compression_ratio = ((original_size - compressed_size) / original_size) * 100
        
        return jsonify({
            'success': True,
            'compressed_filename': output_filename,
            'compressed_size': compressed_size_str,
            'compression_ratio': round(compression_ratio, 2),
            'download_url': url_for('download_file', filename=output_filename, type='compressed')
        })
    
    except Exception as e:
        print(f"Compression error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/download/<type>/<filename>')
def download_file(type, filename):
    """Download original or compressed file"""
    try:
        if type == 'original':
            directory = app.config['UPLOAD_FOLDER']
        elif type == 'compressed':
            directory = app.config['COMPRESSED_FOLDER']
        else:
            return "Invalid type", 400
        
        filepath = os.path.join(directory, filename)
        
        if not os.path.exists(filepath):
            return "File not found", 404
        
        return send_file(filepath, as_attachment=True)
    
    except Exception as e:
        return str(e), 500

@app.route('/cleanup', methods=['POST'])
def cleanup_files():
    """Clean up uploaded and compressed files (optional)"""
    try:
        # In a production app, you might want to implement a proper cleanup schedule
        # For simplicity, we'll just delete files older than 1 hour
        import time
        current_time = time.time()
        
        for folder in [app.config['UPLOAD_FOLDER'], app.config['COMPRESSED_FOLDER']]:
            for filename in os.listdir(folder):
                filepath = os.path.join(folder, filename)
                if os.path.isfile(filepath):
                    # Delete files older than 1 hour
                    if current_time - os.path.getctime(filepath) > 3600:
                        os.remove(filepath)
        
        return jsonify({'success': True, 'message': 'Cleanup completed'})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)