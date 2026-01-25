import { useState } from 'react';

export default function BrowserApp({ user, onClose, onMinimize, isMinimized, zIndex }) {
  const [url, setUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleNavigate = (e) => {
    e.preventDefault();
    let navigationUrl = url;
    
    // Add https:// if no protocol specified
    if (navigationUrl && !navigationUrl.startsWith('http://') && !navigationUrl.startsWith('https://')) {
      navigationUrl = 'https://' + navigationUrl;
    }
    
    setCurrentUrl(navigationUrl);
    setIsLoading(true);
  };

  const handleBack = () => {
    // Future: implement history
  };

  const handleForward = () => {
    // Future: implement history
  };

  const handleRefresh = () => {
    if (currentUrl) {
      setIsLoading(true);
      // Force iframe reload
      const timestamp = new Date().getTime();
      setCurrentUrl(currentUrl + (currentUrl.includes('?') ? '&' : '?') + '_reload=' + timestamp);
    }
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className="h-full flex flex-col bg-[#1E2029]">
      {/* Browser Toolbar */}
      <div className="bg-[#1E2029] px-3 py-2 flex items-center gap-2 border-b border-[#2E3038]">
        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          <button 
            onClick={handleBack}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#2E3038] transition-colors text-gray-400 hover:text-white"
            title="Back"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            onClick={handleForward}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#2E3038] transition-colors text-gray-400 hover:text-white"
            title="Forward"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button 
            onClick={handleRefresh}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#2E3038] transition-colors text-gray-400 hover:text-white"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* URL Bar */}
        <form onSubmit={handleNavigate} className="flex-1">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {/* Lock Icon */}
              {currentUrl && (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
              {/* Brave Logo */}
              <div className="w-4 h-4 bg-orange-500 rounded-sm flex items-center justify-center">
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Search Brave or type a URL"
              className="w-full bg-[#2E3038] text-white text-sm rounded-lg px-10 py-2 outline-none focus:bg-[#3A3B45] placeholder-gray-500 transition-colors"
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-gray-600 border-t-orange-500 rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </form>

        {/* Browser Actions */}
        <div className="flex items-center gap-1">
          <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#2E3038] transition-colors text-gray-400 hover:text-white" title="Bookmarks">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#2E3038] transition-colors text-gray-400 hover:text-white" title="Settings">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#2E3038] transition-colors text-gray-400 hover:text-white" title="Menu">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-white relative overflow-hidden">
        {currentUrl ? (
          <iframe
            src={currentUrl}
            className="w-full h-full border-0"
            title="Browser Content"
            onLoad={handleIframeLoad}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-[#1E2029]">
            <div className="text-center">
              <div className="w-24 h-24 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-16 h-16 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h2 className="text-white text-2xl font-bold mb-2">Brave Browser</h2>
              <p className="text-gray-400 text-sm">Enter a URL to start browsing</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
