// api/index.js (formerly server.js)
const express = require('express');
const path = require('path');
const crypto = require('crypto'); // Node.js built-in module for crypto operations
const rateLimit = require('express-rate-limit');
const fs = require('fs'); // Node.js built-in module for file system operations

const app = express();

// Basic rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes"
});

// Apply the rate limiting to all requests
app.use(limiter);

// Serve static files from the 'public' directory relative to the project root.
// This ensures CSS and other assets are served.
app.use(express.static(path.join(__dirname, '..', 'public')));

// Define a specific route for your embed.html
app.get('/api/embed.html', (req, res) => {
  // Generate a cryptographically strong random nonce
  const nonce = crypto.randomBytes(16).toString('base64');

  // Path to your embed.html file
  const embedHtmlPath = path.join(__dirname, '..', 'public', 'api', 'embed.html');

  // Read the embed.html file
  fs.readFile(embedHtmlPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading embed.html:', err);
      return res.status(500).send('Error loading embeddable content.');
    }

    // Replace the placeholder with the generated nonce
    // The placeholder in embed.html will be: '<!-- NONCE_PLACEHOLDER -->'
    // And the script tags will have 'nonce="NONCE_PLACEHOLDER"' which we will replace
    let modifiedHtml = data.replace(/NONCE_PLACEHOLDER/g, nonce);

    // Set Content-Security-Policy header with the dynamic nonce
    // IMPORTANT: Adjust this CSP to your actual needs.
    // 'unsafe-inline' is used for styles if you have inline <style> tags.
    // 'strict-dynamic' allows scripts with the nonce to execute.
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
    `.replace(/\s+/g, ' ').trim()); // Remove extra whitespace

    res.type('text/html'); // Ensure content type is HTML
    res.send(modifiedHtml);
  });
});

// For Vercel Serverless Functions, you export the app instance.
module.exports = app;
