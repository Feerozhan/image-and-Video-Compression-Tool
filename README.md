# 🗜️ File Compressor - Image & Video Compression Tool

A powerful yet simple web application built with Flask that allows you to compress images and videos without significant quality loss. Perfect for optimizing media files for web use, storage, or sharing.

## 📺 Demo & Preview

### 🎬 Video Demonstration
Watch the complete application walkthrough and see all features in action:

## Project Demo Video

[Watch Demo Video](video/2025-12-26%2017-44-56.mkv)


> 📹 **Note:** Download and play the demo video from the `video/` folder to see:
> - Image compression workflow
> - Video compression process
> - Quality settings in action
> - File upload and download features
> - Real-time compression results

---

## ✨ Features

### Image Compression
- 📸 Support for multiple formats: PNG, JPG, JPEG, GIF, BMP, WEBP
- 🎚️ Adjustable quality settings (10% - 100%)
- 📏 Optional image resizing (width/height)
- 🔄 Maintains aspect ratio
- ⚡ Fast processing with PIL/Pillow

### Video Compression
- 🎥 Support for formats: MP4, AVI, MOV, MKV, WEBM, FLV
- 🎚️ Quality control using CRF (Constant Rate Factor)
- 📐 Video resizing capabilities
- 🔧 Powered by FFmpeg for professional-grade compression
- ⚙️ H.264 encoding with AAC audio

### General Features
- 🖱️ Drag & drop file upload
- 📊 Real-time compression statistics
- 💾 Direct download links for compressed files
- 🧹 Automatic file cleanup (1 hour)
- 🚀 Up to 100MB file size support
- 📱 Responsive design for all devices

## 📁 Project Structure

```
file-compressor/
├── app.py                  # Main Flask application
├── requirements.txt        # Python dependencies
├── README.md              # Project documentation
├── static/
│   ├── script.js          # Frontend JavaScript
│   └── style.css          # CSS styling
├── templates/
│   └── index.html         # Main HTML template
├── uploads/               # Temporary storage for uploaded files (auto-created)
└── compressed/            # Temporary storage for compressed files (auto-created)
```

## 🚀 Installation & Setup

### Prerequisites

**Required:**
- Python 3.8 or higher
- pip (Python package manager)

**For Video Compression (Optional but Recommended):**
- FFmpeg must be installed on your system

#### Installing FFmpeg:

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH

### Step 1: Clone or Download the Project

```bash
git clone <your-repo-url>
cd file-compressor
```

### Step 2: Create Virtual Environment (Recommended)

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Run the Application

```bash
python app.py
```

The application will start on `http://localhost:5000`

## 📖 Usage Guide

### Image Compression

1. **Select Image Tab** - Click on "Image Compressor" tab
2. **Upload Image** - Drag & drop or click to browse (PNG, JPG, GIF, BMP, WEBP)
3. **Adjust Settings:**
   - **Quality:** 10-100% (Default: 85%) - Higher = Better quality, larger file
   - **Max Width:** Optional - Resize image width (maintains aspect ratio)
   - **Max Height:** Optional - Resize image height (maintains aspect ratio)
4. **Compress** - Click "Compress Image" button
5. **Download** - Download your compressed image

### Video Compression

1. **Select Video Tab** - Click on "Video Compressor" tab
2. **Upload Video** - Drag & drop or click to browse (MP4, AVI, MOV, MKV, WEBM, FLV)
3. **Adjust Settings:**
   - **Quality:** 10-100% (Default: 70%) - Controls CRF value for compression
   - **Max Width:** Optional - Resize video width
   - **Max Height:** Optional - Resize video height
4. **Compress** - Click "Compress Video" button (may take time for large files)
5. **Download** - Download your compressed video

### Quality Settings Explained

#### Image Quality
- **10-50%:** Heavy compression, smaller file, visible quality loss
- **50-75%:** Good balance for web use
- **75-85%:** Recommended for most cases
- **85-100%:** Minimal compression, maintains high quality

#### Video Quality (CRF Values)
The application converts quality percentage to FFmpeg CRF:
- **100% quality** → CRF 18 (visually lossless)
- **85% quality** → CRF 23 (default, excellent quality)
- **70% quality** → CRF 28 (good compression)
- **50% quality** → CRF 33 (high compression)
- **10% quality** → CRF 45 (maximum compression)

## ⚙️ Configuration

### File Size Limits

Default maximum file size is **100MB**. To change this, edit in `app.py`:

```python
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # Change value here
```

### Cleanup Schedule

Files older than 1 hour are automatically deleted. To modify, edit the cleanup function in `app.py`:

```python
if current_time - os.path.getctime(filepath) > 3600:  # Change 3600 (seconds)
```

### Allowed File Types

To add more file types, edit these variables in `app.py`:

```python
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'webm', 'flv'}
```

## 🛠️ Technical Details

### Technologies Used

- **Backend:** Flask (Python)
- **Image Processing:** Pillow (PIL)
- **Video Processing:** FFmpeg
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Icons:** Font Awesome
- **Fonts:** Google Fonts (Poppins, Roboto)

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Main application page |
| `/upload` | POST | Upload file and get file info |
| `/compress` | POST | Compress uploaded file |
| `/download/<type>/<filename>` | GET | Download original or compressed file |
| `/cleanup` | POST | Manually trigger file cleanup |

### Image Compression Algorithm

1. Opens image with PIL/Pillow
2. Converts to RGB if necessary (handles transparency)
3. Resizes if dimensions provided (maintains aspect ratio)
4. Saves with specified quality and optimization
5. Returns compressed file with statistics

### Video Compression Algorithm

1. Uses FFmpeg with H.264 codec
2. Converts quality percentage to CRF value
3. Applies video scaling if dimensions provided
4. Uses AAC audio codec
5. Medium preset for balanced speed/quality
6. Returns compressed file with statistics

## 🔒 Security Features

- Secure filename generation using UUID
- File type validation
- File size limits
- Automatic file cleanup
- No permanent file storage

## 🐛 Troubleshooting

### Video Compression Not Working

**Error:** "FFmpeg is not installed"

**Solution:** Install FFmpeg (see Installation section above)

---

**Error:** Video compression fails

**Solution:** 
- Check if video format is supported
- Try with smaller file
- Ensure FFmpeg is properly installed: `ffmpeg -version`

### Upload Issues

**Error:** "File size exceeds 100MB limit"

**Solution:** 
- Compress file before uploading
- Or increase MAX_CONTENT_LENGTH in app.py

---

**Error:** "Invalid file format"

**Solution:** 
- Check if file extension is in allowed list
- Ensure file is not corrupted

## 📝 Tips for Best Results

1. **For Web Use:**
   - Images: 70-85% quality
   - Videos: 60-75% quality
   - Resize to appropriate dimensions

2. **For Storage:**
   - Images: 50-70% quality
   - Videos: 50-65% quality
   - Aggressive resizing

3. **For Printing/Professional Use:**
   - Images: 90-100% quality
   - Minimal resizing

4. **Large Files:**
   - Use lower quality settings
   - Consider resizing dimensions
   - Video compression takes time - be patient!

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 📄 License

This project is licensed under the MIT License - free to use for personal and commercial projects.

## 👨‍💻 Author

Your Name - [feeroz khan]

## 🙏 Acknowledgments

- Flask Framework
- Pillow Library
- FFmpeg Project
- Font Awesome for icons
- Google Fonts

## 📞 Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Contact: [amrozbirmani275@gmail.com]

---

**Made with ❤️ using Flask & Python**

*Happy Compressing! 🚀*
