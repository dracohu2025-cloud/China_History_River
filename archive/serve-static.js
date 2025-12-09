// Simple static file server for production - FIXED MIME types
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;
const distPath = path.join(__dirname, 'history_river/dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',  // FIXED: 使用正确的 MIME 类型
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/json'  // 添加 source map
};

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  let filePath = path.join(distPath, req.url === '/' ? 'index.html' : req.url);
  
  // 安全检查：防止目录遍历
  if (!filePath.startsWith(distPath)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }
  
  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    // 如果是资源文件，返回 404
    if (req.url.startsWith('/assets/') || req.url.startsWith('/@vite/')) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`File not found: ${req.url}`);
      return;
    }
    // 否则返回 index.html (SPA 路由)
    filePath = path.join(distPath, 'index.html');
  }
  
  // 如果是目录，也返回 index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distPath, 'index.html');
  }
  
  // 获取文件扩展名并确定 MIME 类型
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error(`Error reading ${filePath}:`, err);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`Error loading ${req.url}: ${err.message}`);
      return;
    }
    
    res.writeHead(200, { 
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600'
    });
    res.end(data);
  });
});

server.listen(port, () => {
  console.log(`✅ Static file server running on http://localhost:${port}`);
  console.log(`📁 Serving files from: ${distPath}`);
  console.log(`📄 MIME types configured:`, mimeTypes);
});

// 优雅退出
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
