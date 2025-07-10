const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer config to preserve original filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// Upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');
  res.send(`
    File uploaded:<br>
    - <a href="/files/${req.file.originalname}" download>Download ${req.file.originalname}</a>
  `);
});

// File download endpoint
app.get('/files/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).send('File not found');
  
  const ext = path.extname(req.params.filename).toLowerCase();
  
  // Set appropriate content type for PowerPoint files
  if (ext === '.ppt') {
    res.setHeader('Content-Type', 'application/vnd.ms-powerpoint');
  } else if (ext === '.pptx') {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
  }
  
  res.download(filePath);
});

// Homepage with upload form and file list
app.get('/', (req, res) => {
  const files = fs.readdirSync(uploadDir).filter(file => file !== '.gitkeep');
  const listItems = files.map(file => 
    `<li><a href="/files/${file}" download>${file}</a></li>`
  ).join('');
  
  res.send(`
    <h2>PowerPoint File Hosting</h2>
    <form action="/upload" method="post" enctype="multipart/form-data">
      <input type="file" name="file" accept=".ppt,.pptx" required>
      <button type="submit">Upload</button>
    </form>
    <h3>Files:</h3>
    <ul>${listItems}</ul>
  `);
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));