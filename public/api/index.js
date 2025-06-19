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

// Define a specific route for your embed.html
app.get('/api/embed.html', (req, res) => {
  const nonce = crypto.randomBytes(16).toString('base64');

  // Attempting to resolve path relative to the serverless function's location.
  // When using Vercel, `process.cwd()` is often the directory where the bundled function code is.
  // And `includeFiles` usually places them relative to the original project root.
  const embedHtmlPath = path.join(process.cwd(), 'public', 'api', 'embed.html');

  console.log('Attempting to read embed.html from:', embedHtmlPath); // Log for debugging

  fs.readFile(embedHtmlPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading embed.html at path:', embedHtmlPath, err); // More detailed error log
      console.error('Current working directory:', process.cwd()); // For Vercel logs
      // You can uncomment these for more detailed debugging on Vercel logs
      // try { console.error('Files in CWD:', fs.readdirSync(process.cwd())); } catch (e) { console.error('Could not list CWD files:', e); }
      // try { console.error('Files in public/api:', fs.readdirSync(path.join(process.cwd(), 'public', 'api'))); } catch (e) { console.error('Could not list public/api files:', e); }

      // Change status to 404 if file is not found, providing a more helpful message
      return res.status(404).send('Not Found: Embeddable content could not be loaded. Check server logs for details.');
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