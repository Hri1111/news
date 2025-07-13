const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(cors());

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure the uploads directory exists
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir); 
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Multer upload middleware
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type.'), false);
        }
    }
}).single('media'); // IMPORTANT: The field name here must match 'formData.append('media', file);' in upload.js

// Route for file upload
app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error('Multer error:', err);
            return res.status(500).json({ message: `Multer error: ${err.message}` });
        } else if (err) {
            console.error('General upload error:', err);
            return res.status(500).json({ message: `Error: ${err.message}` });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No file selected.' });
        }
        res.status(200).json({ message: 'File uploaded successfully!', filePath: `/uploads/${req.file.filename}` });
    });
});

// Route to get a list of uploaded media files
app.get('/media', (req, res) => {
    const directoryPath = path.join(__dirname, 'uploads');

    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.status(200).json([]); // Return empty array if directory doesn't exist
            }
            console.error('Error reading uploads directory:', err);
            return res.status(500).json({ message: 'Unable to scan files.' });
        }

        const mediaFiles = files.map(file => {
            const ext = path.extname(file).toLowerCase();
            let type = 'unknown';
            if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
                type = 'image';
            } else if (['.mp4', '.webm', '.mov'].includes(ext)) {
                type = 'video';
            }

            return {
                name: file,
                path: `/uploads/${file}`,
                type: type,
            };
        });

        res.status(200).json(mediaFiles);
    });
});



// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded media files directly from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Redirect the root URL '/' to '/index.html'
app.get('/', (req, res) => {
    res.redirect('/index.html');
});

// Route to get a list of uploaded media files
app.get('/media', (req, res) => {
    // Add cache control headers here
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate'); // Prevents caching
    res.set('Pragma', 'no-cache'); // For HTTP/1.0 compatibility
    res.set('Expires', '0'); // Already expired

    const directoryPath = path.join(__dirname, 'uploads');

    fs.readdir(directoryPath, (err, files) => {
        // ... (rest of the /media route logic as before) ...
    });
});

// New route to redirect to the upload page
app.get('/upload-page', (req, res) => {
    res.redirect('/upload.html');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});