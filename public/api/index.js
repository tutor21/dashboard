// api/index.js (formerly server.js)
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const fs = require('fs');

const app = express();

// Basic rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again after 15 minutes"
});

app.use(limiter);

// Serve static files from the 'public' directory relative to the project root.
// This ensures CSS and other assets are served.
app.use(express.static(path.join(__dirname, '..', 'public')));

// Define a specific route for your embed.html
app.get('/api/embed.html', (req, res) => {
  const nonce = crypto.randomBytes(16).toString('base64');

  // Define the path to embed.html more explicitly relative to the serverless function's root
  // When bundled by Vercel with "includeFiles", the file often ends up directly in the function's root,
  // or a path that mirrors the project root's public/api/embed.html
  // Let's try directly accessing it relative to the Vercel function's execution environment.
  // The Vercel build process places 'includeFiles' at a predictable location, often relative to the entry point.
  // In a serverless environment, files specified in 'includeFiles' typically become available
  // relative to the function's root directory, which is the directory containing 'index.js'.
  // So, if 'public/api/embed.html' is included, it might be directly available at 'public/api/embed.html'
  // *relative to the function's root (which is where api/index.js is)*.
  // So, the path becomes `process.cwd()` + `public/api/embed.html`

  const embedHtmlPath = path.join(process.cwd(), 'public', 'api', 'embed.html');
  console.log('Attempting to read embed.html from:', embedHtmlPath); // Add logging for debugging

  // Read the embed.html file
  fs.readFile(embedHtmlPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading embed.html:', err);
      // Log the current working directory and contents to help debug on Vercel
      console.error('Current working directory:', process.cwd());
      // console.error('Files in current working directory:', fs.readdirSync(process.cwd()));
      // console.error('Files in public:', fs.existsSync(path.join(process.cwd(), 'public')) ? fs.readdirSync(path.join(process.cwd(), 'public')) : 'public folder not found');
      return res.status(500).send('Error loading embeddable content. Check server logs.');
    }

    let modifiedHtml = data.replace(/NONCE_PLACEHOLDER/g, nonce);

    res.setHeader('Content-Security-Policy', `
      default-src 'self';
      script-src 'self' 'nonce-${nonce}' https://unpkg.com https://cdn.tailwindcss.com https://www.gstatic.com;
      style-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self';
      img-src 'self' data:;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
    `.replace(/\s+/g, ' ').trim());

    res.type('text/html');
    res.send(modifiedHtml);
  });
});

module.exports = app;