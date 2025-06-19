// src/App.js or src/components/Dashboard.js
import React, { useState, useEffect, useCallback } from 'react';

// Main App Component
const App = () => {
  // State for the currently active license data (for dashboard display)
  const [activeLicense, setActiveLicense] = useState(null);
  // State for the domain input in the license generator
  const [licenseDomainInput, setLicenseDomainInput] = useState('');
  // State for the expiry date input in the license generator
  const [expiryDateInput, setExpiryDateInput] = useState('');
  // State for the generated license string (Base64 encoded)
  const [generatedLicenseString, setGeneratedLicenseString] = useState('');
  // State for the generated embeddable script URL
  const [embedScriptOutput, setEmbedScriptOutput] = useState('');
  // State to hold any messages or errors
  const [message, setMessage] = useState('');

  // Function to generate a simple unique key for the license
  const generateLicenseKey = useCallback(() => {
    return 'LIC-' + Math.random().toString(36).substring(2, 11).toUpperCase();
  }, []);

  // Function to encode license data into a string
  const encodeLicense = useCallback((licenseData) => {
    try {
      const jsonString = JSON.stringify(licenseData);
      return btoa(jsonString); // Base64 encode
    } catch (error) {
      console.error('Error encoding license:', error);
      setMessage('Error encoding license. Check console for details.');
      return '';
    }
  }, []);

  // Function to decode a license string back to data
  const decodeLicense = useCallback((encodedString) => {
    try {
      const jsonString = atob(encodedString); // Base64 decode
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error decoding license:', error);
      setMessage('Invalid license format or not a valid Base64 string.');
      return null;
    }
  }, []);

  // Handler for generating a new license
  const handleGenerateLicense = () => {
    if (!licenseDomainInput || !expiryDateInput) {
      setMessage('Please enter both a domain and an expiry date.');
      return;
    }

    const newLicense = {
      key: generateLicenseKey(),
      domain: licenseDomainInput.toLowerCase().trim(),
      expiryDate: expiryDateInput, //YYYY-MM-DD format
      generationDate: new Date().toISOString().split('T')[0],
    };

    const encodedLicense = encodeLicense(newLicense);
    setGeneratedLicenseString(encodedLicense);
    setMessage('License generated successfully! Copy the string below or generate the embed script.');
  };

  // Handler for applying (loading) a license string to the app's dashboard
  const handleApplyLicenseToDashboard = () => {
    if (!generatedLicenseString) {
      setMessage('Please generate a license first or paste one here.');
      return;
    }

    const decoded = decodeLicense(generatedLicenseString);
    if (decoded) {
      setActiveLicense(decoded);
      setMessage('License applied to the dashboard. The app can now validate it.');
    } else {
      setActiveLicense(null);
      // Message already set by decodeLicense if error
    }
  };

  // Effect to validate the active license whenever it changes or on load
  useEffect(() => {
    // This dashboard component validates against its internal state `activeLicense`
    // The embedded component will validate against its URL parameters.
    if (activeLicense) {
      const currentHost = window.location.hostname;
      const today = new Date();
      const expiry = new Date(activeLicense.expiryDate);

      // Validate domain: allows subdomains (e.g., app.example.com for example.com) or exact match
      const isDomainValid = currentHost.endsWith(activeLicense.domain) || currentHost === activeLicense.domain;

      // Validate expiry
      const isExpired = today > expiry;

      if (!isDomainValid) {
        setMessage(`License invalid: This app is licensed for "${activeLicense.domain}", but is running on "${currentHost}".`);
        // Optionally clear activeLicense if strictly enforcing and it's not from initial props
        // setActiveLicense(null); // Keep for display in dashboard even if invalid for demo
      } else if (isExpired) {
        setMessage(`License expired: This app's license expired on ${activeLicense.expiryDate}.`);
        // setActiveLicense(null); // Keep for display in dashboard even if invalid for demo
      } else {
        setMessage('License is valid and active!');
      }
    } else {
      setMessage('No active license. Generate and apply one, or embed with a pre-configured license.');
    }
  }, [activeLicense, decodeLicense]);

  // Set default expiry date to 1 month from now
  useEffect(() => {
    const today = new Date();
    today.setMonth(today.getMonth() + 1);
    const defaultExpiry = today.toISOString().split('T')[0];
    setExpiryDateInput(defaultExpiry);
  }, []);

  // Function to generate the embeddable JavaScript script URL
  const handleGenerateEmbedScript = () => {
    if (!generatedLicenseString || !licenseDomainInput) {
      setMessage('Please generate a license string and specify a target domain first.');
      setEmbedScriptOutput('');
      return;
    }

    // This is the URL where the 'embed-script-content' HTML file is hosted.
    // This was previously confirmed as 'https://viuflix.online/api/embed.html'.
    const baseUrl = 'https://viuflix.online/api/embed.html';
    const url = `${baseUrl}?site=${encodeURIComponent(licenseDomainInput.toLowerCase().trim())}&license=${encodeURIComponent(generatedLicenseString)}`;

    const scriptTag = `<script src="${url}" async></script>`;
    setEmbedScriptOutput(scriptTag);
    setMessage('Embeddable script URL generated successfully! Copy the script tag below.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4 font-sans text-gray-800 flex items-center justify-center">
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-lg p-6 md:p-8">
        <h1 className="text-3xl font-extrabold text-center text-indigo-700 mb-8">
          Website Embeddable App Dashboard
        </h1>

        {/* Message Area */}
        {message && (
          <div className={`p-4 mb-6 rounded-lg font-medium ${
            message.includes('valid') || message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Dashboard Section */}
        <section className="mb-8 p-6 bg-indigo-50 rounded-lg shadow-inner">
          <h2 className="text-2xl font-bold text-indigo-600 mb-4">Dashboard Status</h2>
          {activeLicense ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg">
              <p>
                <span className="font-semibold">License Key:</span> {activeLicense.key}
              </p>
              <p>
                <span className="font-semibold">Licensed Domain:</span>{' '}
                <span className="bg-yellow-100 px-2 py-1 rounded-md">{activeLicense.domain}</span>
              </p>
              <p>
                <span className="font-semibold">Expiry Date:</span> {activeLicense.expiryDate}
              </p>
              <p>
                <span className="font-semibold">Generation Date:</span>{' '}
                {activeLicense.generationDate}
              </p>
              <p className="md:col-span-2">
                <span className="font-semibold">Current Host:</span>{' '}
                <span className="bg-blue-100 px-2 py-1 rounded-md">{window.location.hostname}</span>
              </p>
            </div>
          ) : (
            <p className="text-gray-600 italic">No license loaded for dashboard validation. Generate one or apply an existing one.</p>
          )}
        </section>

        {/* License Generator Section */}
        <section className="mb-8 p-6 bg-purple-50 rounded-lg shadow-inner">
          <h2 className="text-2xl font-bold text-purple-600 mb-4">License Generator</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="licenseDomain" className="block text-sm font-medium text-gray-700 mb-1">
                Target Domain for License (e.g., example.com):
              </label>
              <input
                type="text"
                id="licenseDomain"
                value={licenseDomainInput}
                onChange={(e) => setLicenseDomainInput(e.target.value)}
                placeholder="yourwebsite.com"
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date:
              </label>
              <input
                type="date"
                id="expiryDate"
                value={expiryDateInput}
                onChange={(e) => setExpiryDateInput(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
          <button
            onClick={handleGenerateLicense}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="inline-block w-5 h-5 mr-2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Generate License String
          </button>

          {generatedLicenseString && (
            <div className="mt-6">
              <label htmlFor="generatedLicense" className="block text-sm font-medium text-gray-700 mb-1">
                Generated License String:
              </label>
              <textarea
                id="generatedLicense"
                readOnly
                value={generatedLicenseString}
                className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm break-all resize-y min-h-[100px]"
                rows="4"
                onClick={(e) => {
                  e.target.select();
                  document.execCommand('copy');
                  setMessage('License string copied to clipboard!');
                }}
              ></textarea>
              <p className="text-xs text-gray-500 mt-2">Click to copy the license string.</p>
            </div>
          )}
        </section>

        {/* Apply License Section (for testing dashboard) */}
        <section className="mb-8 p-6 bg-blue-50 rounded-lg shadow-inner">
          <h2 className="text-2xl font-bold text-blue-600 mb-4">Apply License to Dashboard (For testing)</h2>
          <div className="mb-6">
            <label htmlFor="licenseToApply" className="block text-sm font-medium text-gray-700 mb-1">
              Paste License String Here (Optional):
            </label>
            <textarea
              id="licenseToApply"
              value={generatedLicenseString}
              onChange={(e) => setGeneratedLicenseString(e.target.value)}
              placeholder="Paste your license string here to test it on the dashboard..."
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 font-mono text-sm break-all resize-y min-h-[80px]"
              rows="3"
            ></textarea>
          </div>
          <button
            onClick={handleApplyLicenseToDashboard}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="inline-block w-5 h-5 mr-2"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <line x1="10" y1="9" x2="8" y2="9"></line>
            </svg>
            Apply License to Dashboard
          </button>
        </section>

        {/* Embeddable Script Generator Section */}
        <section className="p-6 bg-green-50 rounded-lg shadow-inner">
          <h2 className="text-2xl font-bold text-green-600 mb-4">Generate Embeddable App Script (URL)</h2>
          <p className="text-gray-700 mb-4">
            After generating a license string and specifying the target domain above, click the button below to generate a `&lt;script&gt;` tag.
            You will need to host the content from the "Embed Script Content (URL Target)" immersive at the URL `https://viuflix.online/api/embed.html` for this embed script to work.
          </p>
          <button
            onClick={handleGenerateEmbedScript}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="inline-block w-5 h-5 mr-2"
            >
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
            Generate Embeddable Script URL
          </button>

          {embedScriptOutput && (
            <div className="mt-6">
              <label htmlFor="embedScript" className="block text-sm font-medium text-gray-700 mb-1">
                Copy and Paste this Script Tag into your Website's `&lt;body&gt;` tag:
              </label>
              <textarea
                id="embedScript"
                readOnly
                value={embedScriptOutput}
                className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm break-all resize-y min-h-[100px]"
                rows="4"
                onClick={(e) => {
                  e.target.select();
                  document.execCommand('copy');
                  setMessage('Embeddable script tag copied to clipboard!');
                }}
              ></textarea>
              <p className="text-xs text-gray-500 mt-2">Click to copy the entire embed script.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default App;