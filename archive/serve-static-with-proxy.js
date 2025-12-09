// Enhanced static file server with API proxy support
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;
const distPath = path.join(__dirname, 'history_river/dist');

console.log('🚀 Starting enhanced static file server...');
console.log(`📁 Serving from: ${distPath}`);
console.log(`🌐 Port: ${port}`);

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
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
  '.map': 'application/json'
};

// CRITICAL: Order by prefix length (longest first) AND use exact prefix matching
const PROXY_RULES = [
  {
    name: 'Django Timeline API',
    prefix: '/timeline-api',
    target: 'http://localhost:8000',
    rewrite: (path) => path.replace(/^\/timeline-api/, '/api/timeline')
  },
  {
    name: 'Express API',
    prefix: '/api',
    target: 'http://localhost:4000',
    rewrite: null
  }
];

// Exact prefix matching function
function matchesPrefix(url, prefix) {
  // Must start with prefix
  if (!url.startsWith(prefix)) return false;
  
  // After prefix, must be either end of string or /
  const afterPrefix = url.substring(prefix.length);
  return afterPrefix === '' || afterPrefix.startsWith('/');
}

const server = http.createServer((req, res) => {
  console.log(`\n${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  const url = req.url;
  let matched = false;
  
  // Check proxy rules in order of prefix length (already sorted above)
  for (let i = 0; i < PROXY_RULES.length; i++) {
    const rule = PROXY_RULES[i];
    
    if (matchesPrefix(url, rule.prefix)) {
      console.log(`✅ Rule "${rule.name}" matched!`);
      
      const rewrittenPath = rule.rewrite ? rule.rewrite(url) : url;
      const targetUrl = rule.target;
      const fullUrl = targetUrl + rewrittenPath;
      
      console.log(`🔄 Proxying to: ${fullUrl}`);
      
      // Parse target URL
      const target = new URL(fullUrl);
      
      // Build proxy options
      const proxyOptions = {
        hostname: target.hostname,
        port: target.port || (target.protocol === 'https:' ? 443 : 80),
        path: target.pathname + target.search,
        method: req.method,
        headers: {
          'Accept': req.headers.accept || 'application/json',
          'User-Agent': req.headers['user-agent'],
          'Host': target.host,
          'Content-Type': req.headers['content-type'] || 'application/json',
          'Content-Length': req.headers['content-length'] || 0
        }
      };
      
      console.log(`   → Host: ${proxyOptions.hostname}, Port: ${proxyOptions.port}, Path: ${proxyOptions.path}`);
      console.log(`   → Method: ${proxyOptions.method}, Content-Type: ${proxyOptions.headers['Content-Type']}`);
      
      // Make proxy request
      const proxyReq = http.request(proxyOptions, (proxyRes) => {
        console.log(`✅ Response: ${proxyRes.statusCode}`);
        
        res.writeHead(proxyRes.statusCode, {
          ...proxyRes.headers,
          'Access-Control-Allow-Origin': '*'
        });
        proxyRes.pipe(res);
      });
      
      proxyReq.on('error', (err) => {
        console.error(`❌ Proxy error: ${err.message}`);
        res.writeHead(502, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
      });
      
      // Forward request body for POST/PUT/PATCH
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          console.log(`   → Request body: ${body.substring(0, 200)}${body.length > 200 ? '...' : ''}`);
          proxyReq.write(body);
          proxyReq.end();
        });
      } else {
        proxyReq.end();
      }
      
      matched = true;
      break;
    }
  }
  
  if (matched) return;
  
  // Serve static files
  console.log(`📄 Serving static: ${url}`);
  
  // Remove query parameters to get the actual file path
  const urlWithoutQuery = url.split('?')[0];
  let filePath = path.join(distPath, urlWithoutQuery === '/' ? 'index.html' : urlWithoutQuery);
  
  // If the specific file doesn't exist, fall back to index.html (for SPA routing)
  if (!fs.existsSync(filePath)) {
    console.log(`   File not found: ${filePath}, falling back to index.html`);
    filePath = path.join(distPath, 'index.html');
  }
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error(`❌ Error: ${err.message}`);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    
    console.log(`✅ Served: ${filePath} (${data.length} bytes, ${contentType})`);
    
    res.writeHead(200, { 
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600'
    });
    res.end(data);
  });
});

server.listen(port, () => {
  console.log(`\n✅ SERVER RUNNING ON http://localhost:${port}`);
  console.log(`\n🔄 Proxy rules (longest prefix first):`);
  PROXY_RULES.forEach((rule, i) => {
    console.log(`   ${i + 1}. "${rule.prefix}" -> ${rule.target}`);
    if (rule.rewrite) console.log(`      Path rewrite active`);
  });
  console.log('');
});

['SIGTERM', 'SIGINT'].forEach(signal => {
  process.on(signal, () => {
    console.log(`\n${signal} received`);
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});
