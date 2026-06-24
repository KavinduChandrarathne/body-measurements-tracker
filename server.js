const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const DATA_FILE = path.join(ROOT_DIR, 'data', 'measurements.json');

function ensureDataFile() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
        fs.writeFileSync(DATA_FILE, '[]', 'utf8');
    }
}

function readMeasurements() {
    ensureDataFile();
    const content = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(content);
}

function writeMeasurements(data) {
    ensureDataFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function sendJson(res, statusCode, data) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.writeHead(statusCode);
    res.end(JSON.stringify(data));
}

function serveStaticFile(res, filePath) {
    const extension = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml'
    };

    const contentType = mimeTypes[extension] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not found');
            return;
        }

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'OPTIONS' && url.pathname === '/api/measurements') {
        sendJson(res, 204, {});
        return;
    }

    if (req.method === 'GET' && url.pathname === '/api/measurements') {
        const measurements = readMeasurements();
        sendJson(res, 200, measurements);
        return;
    }

    if (req.method === 'POST' && url.pathname === '/api/measurements') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const newEntry = JSON.parse(body || '{}');
                const measurements = readMeasurements();
                measurements.push(newEntry);
                writeMeasurements(measurements);
                sendJson(res, 200, { success: true, measurements });
            } catch (error) {
                sendJson(res, 400, { success: false, error: 'Invalid JSON payload' });
            }
        });

        return;
    }

    if (req.method === 'GET') {
        const requestPath = url.pathname === '/' ? '/index.html' : url.pathname;
        const safePath = path.normalize(requestPath).replace(/^\.+/, '');
        const filePath = path.join(ROOT_DIR, safePath);

        if (filePath.startsWith(ROOT_DIR) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            serveStaticFile(res, filePath);
            return;
        }
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
