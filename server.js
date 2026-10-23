const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
    // Strip query strings and decode URI
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    let relativePath = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    let filePath = path.join(PUBLIC_DIR, relativePath);

    // Security check: Prevent directory traversal
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
    }

    const extname = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // If requesting route without extension, check if corresponding .html exists
                if (!extname && fs.existsSync(filePath + '.html')) {
                    fs.readFile(filePath + '.html', (htmlErr, htmlContent) => {
                        if (htmlErr) {
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('500 Server Error');
                        } else {
                            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                            res.end(htmlContent, 'utf-8');
                        }
                    });
                    return;
                }
                // If requesting route without extension or HTML route, fallback to index.html
                if (!extname || extname === '.html') {
                    fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (error, html) => {
                        if (error) {
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('500 Server Error');
                        } else {
                            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                            res.end(html, 'utf-8');
                        }
                    });
                } else {
                    // For missing static assets, return proper 404
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('404 Not Found');
                }
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use.`);
    } else {
        console.error(`Server error:`, err);
    }
});
