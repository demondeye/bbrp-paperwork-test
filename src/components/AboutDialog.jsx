import { useState } from 'react';

export default function AboutDialog({ onClose }) {
  const [showDonationConfirm, setShowDonationConfirm] = useState(false);

  const handleDonateClick = () => {
    setShowDonationConfirm(true);
  };

  const handleConfirmDonation = () => {
    setShowDonationConfirm(false);
    // Open PayPal in new tab
    window.open('https://www.paypal.com/donate/?hosted_button_id=HU26Y2A7S84DY', '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={onClose}>
        <div 
          className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-lg">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center text-4xl">
                💻
              </div>
              <div>
                <h2 className="text-2xl font-bold">VicPol Desktop</h2>
                <p className="text-blue-100 text-sm">Version 1.0.0</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">About This Application</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                VicPol Desktop is a comprehensive desktop environment designed for law enforcement professionals. 
                It provides a modern, intuitive interface for managing paperwork, applications, and daily operations.
              </p>
            </div>

            {/* Developer Info */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Developer</h3>
              <p className="text-gray-600 text-sm">
                Created by <span className="font-medium text-gray-900">Sian now-cow</span>
              </p>
            </div>

            {/* Features */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Features</h3>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>• Windows-style desktop environment</li>
                <li>• Cloud-synced application management</li>
                <li>• Customizable backgrounds</li>
                <li>• Multi-user support with Firebase</li>
                <li>• App Store for easy installation</li>
              </ul>
            </div>

            {/* Donation */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Support Development</h3>
              <p className="text-gray-600 text-sm mb-3">
                If you find this application useful, consider supporting its development.
              </p>
              
              <div className="flex gap-4 items-start">
                {/* PayPal Button */}
                <button
                  onClick={handleDonateClick}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 00-.794.68l-.04.22-.63 3.993-.028.15a.805.805 0 01-.794.679H7.72a.483.483 0 01-.477-.558L8.926 11.8h.01l.766-4.852a.972.972 0 01.959-.819h2.06c.014 0 .027 0 .04.002 2.138.01 3.895.524 5.306 2.347z"/>
                  </svg>
                  Donate via PayPal
                </button>

                {/* QR Code */}
                <div className="flex flex-col items-center gap-1">
                  <img 
                    src="/paypal-qr.png" 
                    alt="PayPal QR Code"
                    className="w-24 h-24 border-2 border-gray-200 rounded-lg"
                  />
                  <span className="text-xs text-gray-500">Scan to donate</span>
                </div>
              </div>
            </div>

            {/* Copyright */}
            <div className="border-t pt-4 text-center">
              <p className="text-gray-500 text-xs">
                © 2026 Sian now-cow. All rights reserved.
              </p>
            </div>
          </div>

          {/* Close Button */}
          <div className="p-4 bg-gray-50 rounded-b-lg flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Donation Confirmation Dialog */}
      {showDonationConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110]" onClick={() => setShowDonationConfirm(false)}>
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">Redirecting to PayPal</h3>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-700 text-base leading-relaxed mb-4">
                You will be redirected to PayPal's secure donation page in a new tab to complete your contribution.
              </p>
              <p className="text-gray-600 text-sm leading-relaxed">
                After completing your donation, you can close the PayPal tab and return to this application.
              </p>
            </div>

            {/* Buttons */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowDonationConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDonation}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Continue to PayPal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
