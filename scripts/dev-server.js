#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');

async function start() {
  const { createServer } = await import('vite');
  const vite = await createServer({
    base: '/orgchart/',
    server: {
      middlewareMode: true,
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        port: 5173
      }
    }
  });

  const PORT = 5173;

  const server = http.createServer(async (req, res) => {
    if (!req.url) {
      res.statusCode = 400;
      return res.end('Bad Request');
    }

    // Only handle under /orgchart
    if (!req.url.startsWith('/orgchart')) {
      res.statusCode = 404;
      return res.end('Not Found');
    }

    // Map /orgchart/* -> /* for Vite middlewares/assets/HMR
    const originalUrl = req.url;
    req.url = req.url.replace('/orgchart', '') || '/';

    vite.middlewares(req, res, async () => {
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        const rawHtml = fs.readFileSync(indexPath, 'utf-8');
        const html = await vite.transformIndexHtml(originalUrl, rawHtml);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(html);
      } catch (err) {
        vite.ssrFixStacktrace(err);
        res.statusCode = 500;
        res.end(err.message);
      }
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Dev server running at http://localhost:${PORT}/orgchart/`);
  });
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});

