document.addEventListener('DOMContentLoaded', function() {
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show active tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
            
            // Reset forms when switching tabs
            resetForms();
        });
    });
    
    // File upload functionality
    setupFileUpload('image');
    setupFileUpload('video');
    
    // Compression quality sliders
    setupQualitySlider('image');
    setupQualitySlider('video');
    
    // Compression buttons
    document.getElementById('compress-image').addEventListener('click', () => compressFile('image'));
    document.getElementById('compress-video').addEventListener('click', () => compressFile('video'));
    
    // Initialize
    resetForms();
});

// Store uploaded file data globally
const uploadedFiles = {
    image: null,
    video: null
};

// Prevent multiple simultaneous uploads
let isUploading = false;

function setupFileUpload(type) {
    const uploadArea = document.getElementById(`${type}-upload-area`);
    const fileInput = document.getElementById(`${type}-input`);
    const fileInfoSection = document.getElementById(`${type}-file-info`);
    const fileName = document.getElementById(`${type}-file-name`);
    const fileSize = document.getElementById(`${type}-original-size`);
    const downloadLink = document.getElementById(`${type}-original-download`);
    
    // Make sure file input is hidden
    if (fileInput) {
        fileInput.style.display = 'none';
        fileInput.style.visibility = 'hidden';
        fileInput.style.position = 'absolute';
        fileInput.style.opacity = '0';
        fileInput.style.pointerEvents = 'none';
    }
    
    // Click to upload - with debounce
    let clickTimeout = null;
    uploadArea.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Prevent multiple clicks
        if (clickTimeout) return;
        
        clickTimeout = setTimeout(() => {
            clickTimeout = null;
        }, 500);
        
        fileInput.click();
    });
    
    // Drag and drop functionality
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');
        
        if (e.dataTransfer.files.length > 0) {
            handleFileSelect(type, e.dataTransfer.files[0]);
        }
    });
    
    // File input change - with protection against multiple triggers
    let lastFileName = '';
    fileInput.addEventListener('change', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            
            // Prevent duplicate uploads of same file
            if (file.name === lastFileName) {
                console.log('Same file already being uploaded, skipping...');
                return;
            }
            
            lastFileName = file.name;
            handleFileSelect(type, file);
        }
    });
    
    function handleFileSelect(fileType, file) {
        // Prevent multiple simultaneous uploads
        if (isUploading) {
            console.log('Upload already in progress, please wait...');
            return;
        }
        
        // Validate file
        if (!file) {
            alert('No file selected');
            return;
        }
        
        // Validate file size (100MB max)
        if (file.size > 100 * 1024 * 1024) {
            alert('File size exceeds 100MB limit. Please choose a smaller file.');
            return;
        }
        
        // Validate file type
        if (fileType === 'image') {
            const validExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'];
            const fileExt = file.name.split('.').pop().toLowerCase();
            if (!validExtensions.includes(fileExt)) {
                alert('Invalid image format. Allowed: PNG, JPG, JPEG, GIF, BMP, WEBP');
                return;
            }
        } else if (fileType === 'video') {
            const validExtensions = ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv'];
            const fileExt = file.name.split('.').pop().toLowerCase();
            if (!validExtensions.includes(fileExt)) {
                alert('Invalid video format. Allowed: MP4, AVI, MOV, MKV, WEBM, FLV');
                return;
            }
        }
        
        // Set uploading flag
        isUploading = true;
        
        // Show loading
        showLoading(`Uploading ${fileType}...`);
        
        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('file_type', fileType);
        
        console.log(`Uploading ${fileType}:`, file.name, 'Size:', file.size);
        
        // Upload file to server
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error || 'Upload failed');
                });
            }
            return response.json();
        })
        .then(data => {
            hideLoading();
            isUploading = false;
            
            if (data.success) {
                // Store the uploaded file data
                uploadedFiles[fileType] = data;
                
                // Update UI with file info
                fileName.textContent = data.original_name;
                fileSize.textContent = data.file_size;
                downloadLink.href = data.download_url;
                
                // Show file info section
                fileInfoSection.style.display = 'block';
                
                // Hide any previous results
                document.getElementById(`${fileType}-result`).style.display = 'none';
                
                // Update result section with original size
                document.getElementById(`${fileType}-result-original`).textContent = data.file_size;
                
                console.log(`${fileType} uploaded successfully:`, data.filename);
                
                // Reset file input
                fileInput.value = '';
                lastFileName = '';
            } else {
                alert(`Error: ${data.error}`);
            }
        })
        .catch(error => {
            hideLoading();
            isUploading = false;
            console.error('Error uploading file:', error);
            alert(`Upload failed: ${error.message}`);
            
            // Reset
            fileInput.value = '';
            lastFileName = '';
        });
    }
}

function setupQualitySlider(type) {
    const slider = document.getElementById(`${type}-quality`);
    const valueDisplay = document.getElementById(`${type}-quality-value`);
    
    slider.addEventListener('input', () => {
        valueDisplay.textContent = `${slider.value}%`;
    });
}

function compressFile(type) {
    // Check if file is uploaded
    if (!uploadedFiles[type]) {
        alert(`Please upload a ${type} file first.`);
        return;
    }
    
    // Get compression settings
    const quality = document.getElementById(`${type}-quality`).value;
    const maxWidth = document.getElementById(`${type}-max-width`).value || 0;
    const maxHeight = document.getElementById(`${type}-max-height`).value || 0;
    
    // Show loading
    showLoading(`Compressing ${type}... This may take a moment for large files.`);
    
    console.log('Compressing with settings:', {
        filename: uploadedFiles[type].filename,
        type: type,
        quality: quality,
        maxWidth: maxWidth,
        maxHeight: maxHeight
    });
    
    // Send the actual filename from uploaded data
    fetch('/compress', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            filename: uploadedFiles[type].filename,
            file_type: type,
            quality: parseInt(quality),
            max_width: parseInt(maxWidth) || 0,
            max_height: parseInt(maxHeight) || 0
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || 'Compression failed');
            });
        }
        return response.json();
    })
    .then(data => {
        hideLoading();
        
        if (data.success) {
            // Update UI with compression results
            const resultSection = document.getElementById(`${type}-result`);
            const compressedSize = document.getElementById(`${type}-result-compressed`);
            const reduction = document.getElementById(`${type}-result-reduction`);
            const downloadLink = document.getElementById(`${type}-compressed-download`);
            
            compressedSize.textContent = data.compressed_size;
            reduction.textContent = `${data.compression_ratio}% smaller`;
            downloadLink.href = data.download_url;
            
            // Show result section
            resultSection.style.display = 'block';
            
            // Scroll to results
            resultSection.scrollIntoView({ behavior: 'smooth' });
            
            console.log(`${type} compressed successfully:`, data.compressed_filename);
        } else {
            alert(`Error: ${data.error}`);
        }
    })
    .catch(error => {
        hideLoading();
        console.error('Error compressing file:', error);
        alert(`Compression failed: ${error.message}`);
    });
}

function showLoading(message) {
    const modal = document.getElementById('loading-modal');
    const messageElement = document.getElementById('loading-message');
    
    if (modal && messageElement) {
        messageElement.textContent = message;
        modal.classList.add('active');
    }
}

function hideLoading() {
    const modal = document.getElementById('loading-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function resetForms() {
    // Clear uploaded files data
    uploadedFiles.image = null;
    uploadedFiles.video = null;
    
    // Reset uploading flag
    isUploading = false;
    
    // Reset all file inputs
    const imageInput = document.getElementById('image-input');
    const videoInput = document.getElementById('video-input');
    if (imageInput) imageInput.value = '';
    if (videoInput) videoInput.value = '';
    
    // Hide file info sections
    const imageFileInfo = document.getElementById('image-file-info');
    const videoFileInfo = document.getElementById('video-file-info');
    if (imageFileInfo) imageFileInfo.style.display = 'none';
    if (videoFileInfo) videoFileInfo.style.display = 'none';
    
    // Hide result sections
    const imageResult = document.getElementById('image-result');
    const videoResult = document.getElementById('video-result');
    if (imageResult) imageResult.style.display = 'none';
    if (videoResult) videoResult.style.display = 'none';
    
    // Reset quality sliders
    const imageQuality = document.getElementById('image-quality');
    const imageQualityValue = document.getElementById('image-quality-value');
    if (imageQuality && imageQualityValue) {
        imageQuality.value = 85;
        imageQualityValue.textContent = '85%';
    }
    
    const videoQuality = document.getElementById('video-quality');
    const videoQualityValue = document.getElementById('video-quality-value');
    if (videoQuality && videoQualityValue) {
        videoQuality.value = 70;
        videoQualityValue.textContent = '70%';
    }
    
    // Reset dimension inputs
    const imageMaxWidth = document.getElementById('image-max-width');
    const imageMaxHeight = document.getElementById('image-max-height');
    const videoMaxWidth = document.getElementById('video-max-width');
    const videoMaxHeight = document.getElementById('video-max-height');
    
    if (imageMaxWidth) imageMaxWidth.value = '';
    if (imageMaxHeight) imageMaxHeight.value = '';
    if (videoMaxWidth) videoMaxWidth.value = '';
    if (videoMaxHeight) videoMaxHeight.value = '';
}

// Helper function for formatting file sizes
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}