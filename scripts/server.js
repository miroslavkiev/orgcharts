#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4173;
const DIST_DIR = path.resolve(__dirname, '..', 'dist');

const server = http.createServer((req, res) => {
  let filePath = req.url;
  
  // Remove /orgchart prefix if present to get the actual file path
  if (filePath.startsWith('/orgchart/')) {
    filePath = filePath.slice('/orgchart'.length);
  }
  
  // Normalize and join with dist directory
  filePath = path.normalize(filePath);
  const fullPath = path.join(DIST_DIR, filePath === '/' ? 'index.html' : filePath);
  
  // Security check: ensure path is within DIST_DIR
  if (!fullPath.startsWith(DIST_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }
  
  // Try to serve the file
  fs.stat(fullPath, (err, stats) => {
    if (err || !stats.isFile()) {
      // File not found, serve index.html for SPA routing
      const indexPath = path.join(DIST_DIR, 'index.html');
      fs.readFile(indexPath, (err, data) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('500 Internal Server Error');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data);
      });
      return;
    }
    
    // Determine content type
    const ext = path.extname(fullPath);
    const contentTypes = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.json': 'application/json'
    };
    const contentType = contentTypes[ext] || 'application/octet-stream';
    
    fs.readFile(fullPath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`  ➜  Local:   http://localhost:${PORT}/orgchart/`);
  console.log(`  ➜  Network: http://0.0.0.0:${PORT}/orgchart/`);
});
