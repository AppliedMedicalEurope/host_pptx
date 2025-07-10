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

// Delete file endpoint
app.delete('/files/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).send('File not found');
  
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('Error deleting file:', err);
      return res.status(500).send('Error deleting file');
    }
    res.send('File deleted successfully');
  });
});

// Homepage with file list and delete options
app.get('/', (req, res) => {
  const files = fs.readdirSync(uploadDir).filter(file => file !== '.gitkeep');
  const listItems = files.map(file => 
    `<li>
      <a href="/files/${file}" download>${file}</a>
      <button onclick="deleteFile('${file}')" style="margin-left: 10px;">Delete</button>
    </li>`
  ).join('');
  
  res.send(`
    <h2>PowerPoint File Hosting</h2>
    <h3>Files:</h3>
    <ul>${listItems}</ul>
    <script>
      function deleteFile(filename) {
        if (confirm('Are you sure you want to delete ' + filename + '?')) {
          fetch('/files/' + filename, { method: 'DELETE' })
            .then(response => response.text())
            .then(data => {
              alert(data);
              location.reload();
            })
            .catch(error => {
              console.error('Error:', error);
              alert('Error deleting file');
            });
        }
      }
    </script>
  `);
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
