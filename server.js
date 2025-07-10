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
    - <a href="/render/${req.file.originalname}" target="_blank">View as Webpage</a><br>
    - <a href="/files/${req.file.originalname}" target="_blank">Raw File Link</a>
  `);
});

// Render HTML in-browser via /render
app.get('/render/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).send('File not found');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return res.status(500).send('Server error');
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline');
    res.send(data);
  });
});

// Raw file access (optional)
app.get('/files/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).send('File not found');
  res.download(filePath); // fallback download behavior
});

// Homepage with upload form and file list
app.get('/', (req, res) => {
  const files = fs.readdirSync(uploadDir).filter(file => file !== '.gitkeep');
  const listItems = files.map(file => `<li><a href="/render/${file}" target="_blank">${file}</a></li>`).join('');
  res.send(`
    <h2>CI Form Suggestions</h2>
    <ul>${listItems}</ul>
  `);
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
