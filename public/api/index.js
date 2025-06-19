// api/index.js (Optimized for Render deployment)
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const fs = require('fs');

const app = express();

// Basic rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes"
});

// Apply the rate limiting to all requests
app.use(limiter);

// Serve static files from the 'public' directory relative to the project root.
// On Render, the project root is typically where your package.json is.
// This ensures CSS, JS, and your embed.html are accessible.
app.use(express.static(path.join(__dirname, '..', 'public')));

// Log to confirm server startup on Render
console.log('Node.js server for embeddable content is starting up on Render...');

// Define the route for your embed.html
app.get('/api/embed.html', (req, res) => {
  console.log('Request received for /api/embed.html'); // Log for Render dashboard

  // Generate a cryptographically strong random nonce for CSP
  const nonce = crypto.randomBytes(16).toString('base64');

  // Construct the absolute path to embed.html.
  // In a traditional Node.js server deployment like Render,
  // process.cwd() usually points to the project root.
  const embedHtmlPath = path.join(process.cwd(), 'public', 'api', 'embed.html');

  console.log('Attempting to read embed.html from:', embedHtmlPath);

  // Read the embed.html file content
  fs.readFile(embedHtmlPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading embed.html at path:', embedHtmlPath, err); // Detailed error log
      console.error('Current working directory:', process.cwd()); // For Render logs
      // In Render logs, you can often see filesystem contents, which helps debug 'ENOENT' errors.
      return res.status(404).send('Not Found: Embeddable content could not be loaded. Check server logs for details.');
    }

    // Replace the nonce placeholder in the HTML content
    let modifiedHtml = data.replace(/NONCE_PLACEHOLDER/g, nonce);

    // Set Content-Security-Policy header with the dynamic nonce
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

    res.type('text/html'); // Set response content type
    res.send(modifiedHtml); // Send the modified HTML
  });
});

// Add a simple test route to confirm server is alive
app.get('/api/test', (req, res) => {
  console.log('/api/test route hit on Render. Server is alive!');
  res.send('Hello from /api/test on Render! This confirms the server is running.');
});

// IMPORTANT: For Render (and other traditional Node.js hosting),
// the Express app MUST listen on the port provided by the hosting environment.
// Render provides this via the PORT environment variable.
const port = process.env.PORT || 10000; // Use Render's PORT or a default for local testing
app.listen(port, () => {
  console.log(`Render-optimized server listening on port ${port}`);
  console.log(`Access embeddable content at /api/embed.html`);
  console.log(`Access test route at /api/test`);
});

// Remove module.exports = app; if it was present, as it's specific to serverless functions.
// module.exports = app;
