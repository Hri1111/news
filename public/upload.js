// Get DOM elements
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const previewContainer = document.getElementById('preview-container');
const uploadButton = document.getElementById('upload-button');
const statusMessage = document.getElementById('status-message');

// Store files selected by the user
let filesToUpload = [];

// Allowed file types and maximum file size (in bytes)
// Ensure these match the server-side validation in server.js
const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'];
const maxFileSize = 10 * 1024 * 1024; // 10MB (Matching server.js limit)

// --- Drag and Drop functionality ---

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Highlight drop area when dragging over
dropArea.addEventListener('dragenter', highlight, false);
dropArea.addEventListener('dragover', highlight, false);
dropArea.addEventListener('dragleave', unhighlight, false);

function highlight() {
    dropArea.classList.add('active');
}

function unhighlight() {
    dropArea.classList.remove('active');
}

// Handle dropped files
dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    unhighlight();
    handleFiles(files);
}

// --- File selection via browse button ---

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

// --- Handle files (preview and validation) ---

function handleFiles(files) {
    // Clear previous status message when new files are selected
    statusMessage.textContent = '';
    statusMessage.style.color = '';

    for (const file of files) {
        if (validateFile(file)) {
            filesToUpload.push(file);
            previewFile(file);
        } else {
            // If a file is invalid, display an error and don't add it
            // The validateFile function already sets the status message
            console.warn(`File ${file.name} was not added due to validation error.`);
        }
    }
    updateUploadButtonState();
}

function validateFile(file) {
    // Validate file type
    if (!allowedTypes.includes(file.type)) {
        statusMessage.textContent = `Error: ${file.name} is not a supported file type.`;
        statusMessage.style.color = 'red';
        return false;
    }
    // Validate file size
    if (file.size > maxFileSize) {
        statusMessage.textContent = `Error: ${file.name} is too large (max ${maxFileSize / (1024 * 1024)}MB).`;
        statusMessage.style.color = 'red';
        return false;
    }
    // If validation passes, clear any previous error message (only if this file is valid)
    // The loop in handleFiles will overwrite this if subsequent files are invalid
    return true;
}

function previewFile(file) {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onloadend = function () {
        const previewElement = document.createElement('div');
        previewElement.classList.add('file-preview');

        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = reader.result;
            img.alt = file.name;
            previewElement.appendChild(img);
        } else if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = reader.result;
            video.controls = true;
            video.alt = file.name;
            // It's good practice to set a preload attribute for videos in previews
            // preload="metadata" loads just enough to get the video's duration and dimensions
            video.preload = "metadata";
            previewElement.appendChild(video);
        }

        const fileName = document.createElement('p');
        fileName.textContent = file.name;
        previewElement.appendChild(fileName);

        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.classList.add('remove-button');
        removeButton.addEventListener('click', () => removeFile(file, previewElement));
        previewElement.appendChild(removeButton);

        previewContainer.appendChild(previewElement);
    };
}

function removeFile(fileToRemove, previewElement) {
    filesToUpload = filesToUpload.filter(file => file !== fileToRemove);
    previewContainer.removeChild(previewElement);
    updateUploadButtonState();
    // Clear status message if no files are left
    if (filesToUpload.length === 0) {
        statusMessage.textContent = '';
        statusMessage.style.color = '';
    }
}

function updateUploadButtonState() {
    if (filesToUpload.length > 0) {
        uploadButton.disabled = false;
    } else {
        uploadButton.disabled = true;
    }
}

// --- Upload to server ---

uploadButton.addEventListener('click', uploadFiles);

async function uploadFiles() {
    if (filesToUpload.length === 0) {
        statusMessage.textContent = 'Please select files to upload.';
        statusMessage.style.color = 'orange';
        return;
    }

    statusMessage.textContent = 'Uploading...';
    statusMessage.style.color = 'blue';
    uploadButton.disabled = true;

    const formData = new FormData();
    filesToUpload.forEach(file => {
        // IMPORTANT: 'media' is the field name your server (Multer) expects in server.js
        // Multer was configured with .single('media')
        formData.append('media', file);
    });

    try {
        const response = await fetch('/upload', { // Your backend upload endpoint
            method: 'POST',
            body: formData,
            // Do NOT set 'Content-Type' header here; the browser handles it for FormData with multipart/form-data
        });

        const result = await response.json();

        if (response.ok) { // Check if the HTTP status is in the 200-299 range
            statusMessage.textContent = `Upload successful: ${result.message}`;
            statusMessage.style.color = 'green';
            filesToUpload = []; // Clear the files array after successful upload
            previewContainer.innerHTML = ''; // Clear previews
        } else {
            // Handle specific error messages from the server
            statusMessage.textContent = `Upload failed: ${result.message || 'Unknown error'}`;
            statusMessage.style.color = 'red';
            // Do NOT clear filesToUpload or previews on failure, so user can try again or remove
        }
    } catch (error) {
        console.error('Network error during upload:', error);
        statusMessage.textContent = 'A network error occurred during upload. Please try again.';
        statusMessage.style.color = 'red';
        // Do NOT clear filesToUpload or previews on failure
    } finally {
        updateUploadButtonState(); // Re-enable or disable based on remaining files
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateUploadButtonState();
    // Clear any leftover status message from previous session if page was reloaded
    statusMessage.textContent = '';
    statusMessage.style.color = '';
});