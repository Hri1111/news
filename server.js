const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000; // Use environment port if available

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
        // Create unique filenames to avoid conflicts, preserving original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension); // Example: media-1752415317107-123456789.jpg
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
            cb(new Error('Invalid file type. Only JPG, PNG, GIF, MP4, WebM, MOV are allowed.'), false);
        }
    }
}).single('media'); // 'media' is the name of the input field in the form (from upload.js)

// --- Routes Setup ---

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
    // Add cache control headers here to prevent browser caching of the media list
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache'); // For HTTP/1.0 compatibility
    res.set('Expires', '0'); // Instructs browser that response is already stale

    const directoryPath = path.join(__dirname, 'uploads');

    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            // Handle the case where the directory might not exist or permissions are an issue
            if (err.code === 'ENOENT') {
                // If 'uploads' directory doesn't exist, return empty array gracefully
                return res.status(200).json([]);
            }
            console.error('Error reading uploads directory:', err);
            return res.status(500).json({ message: 'Unable to scan files.' });
        }

        // Map filenames to objects containing name, public path, and detected type
        const mediaFiles = files.map(file => {
            const ext = path.extname(file).toLowerCase();
            let type = 'unknown';
            if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
                type = 'image';
            } else if (['.mp4', '.webm', '.mov'].includes(ext)) { // Added .mov based on common video types
                type = 'video';
            }

            return {
                name: file,
                path: `/uploads/${file}`, // Path accessible from the client (via static middleware)
                type: type,
            };
        });

        res.status(200).json(mediaFiles);
    });
});

// Route to delete an uploaded media file
app.delete('/media/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename); // Construct full path safely

    // Check if the file actually exists before trying to unlink
    fs.access(filePath, fs.constants.F_OK, (accessErr) => {
        if (accessErr) {
            console.error(`File ${filename} not found or inaccessible for deletion.`);
            return res.status(404).json({ message: 'File not found or inaccessible.' });
        }

        fs.unlink(filePath, (err) => { // Attempt to delete the file
            if (err) {
                console.error(`Error deleting file ${filename}:`, err);
                return res.status(500).json({ message: `Error deleting file: ${err.message}` });
            }
            res.status(200).json({ message: `File ${filename} deleted successfully.` });
        });
    });
});


// Serve Static Files (Frontend HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded media files directly from the 'uploads' directory
// This makes the files accessible via URLs like http://localhost:3000/uploads/myimage.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Redirect the root URL '/' to the index.html page
app.get('/', (req, res) => {
    res.redirect('/index.html');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`News page: http://localhost:${port}/index.html`);
    console.log(`Upload page: http://localhost:${port}/upload.html`);
});
