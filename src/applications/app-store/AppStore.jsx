import { useState, useEffect } from 'react';
import { getAllApps } from '../../utils/appRegistry';
import AppIcon from '../../components/AppIcon';
import CircularProgress from '../../components/CircularProgress';

export default function AppStore({ installedApps = [], onInstallApp, onUninstallApp, onOpenApp }) {
  const [availableApps, setAvailableApps] = useState([]);
  const [installingApps, setInstallingApps] = useState(new Map()); // Map<appId, progress>
  const [uninstallingApps, setUninstallingApps] = useState(new Map()); // Map<appId, progress>
  const [featuredApp, setFeaturedApp] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null); // For detail view

  useEffect(() => {
    // Load available apps from registry, excluding app-store itself
    const apps = getAllApps().filter(app => app.appId !== 'app-store');
    setAvailableApps(apps);
    
    // Set first app as featured
    if (apps.length > 0) {
      setFeaturedApp(apps[0]);
    }
  }, []);

  const isInstalled = (appId) => {
    return installedApps.includes(appId);
  };

  const handleInstall = async (appId) => {
    // Initialize progress
    setInstallingApps(prev => new Map(prev).set(appId, 0));
    
    // Animate progress from 0 to 100 over 2 seconds
    const duration = 2000;
    const steps = 50;
    const stepDuration = duration / steps;
    
    for (let i = 0; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepDuration));
      const progress = (i / steps) * 100;
      setInstallingApps(prev => new Map(prev).set(appId, progress));
    }
    
    // Actually install
    onInstallApp(appId);
    
    // Remove from installing map
    setInstallingApps(prev => {
      const newMap = new Map(prev);
      newMap.delete(appId);
      return newMap;
    });
  };

  const handleUninstall = async (appId) => {
    // Initialize progress
    setUninstallingApps(prev => new Map(prev).set(appId, 0));
    
    // Animate progress from 0 to 100 over 1.5 seconds
    const duration = 1500;
    const steps = 50;
    const stepDuration = duration / steps;
    
    for (let i = 0; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepDuration));
      const progress = (i / steps) * 100;
      setUninstallingApps(prev => new Map(prev).set(appId, progress));
    }
    
    // Actually uninstall
    onUninstallApp(appId);
    
    // Remove from uninstalling map
    setUninstallingApps(prev => {
      const newMap = new Map(prev);
      newMap.delete(appId);
      return newMap;
    });
  };

  const renderButton = (app) => {
    const isInstalling = installingApps.has(app.appId);
    const isUninstalling = uninstallingApps.has(app.appId);
    const installed = isInstalled(app.appId);

    if (isInstalling || isUninstalling) {
      return (
        <button
          disabled
          className="px-6 py-2 bg-gray-200 text-gray-400 rounded-full font-semibold text-sm cursor-not-allowed flex items-center gap-2 min-w-[80px] justify-center"
        >
          <CircularProgress 
            progress={installingApps.get(app.appId) || uninstallingApps.get(app.appId)} 
            size={20} 
            strokeWidth={2}
            color={isInstalling ? 'blue' : 'orange'}
          />
          {Math.round(installingApps.get(app.appId) || uninstallingApps.get(app.appId))}%
        </button>
      );
    }

    if (installed) {
      return (
        <button
          onClick={() => onOpenApp(app.appId)}
          className="px-6 py-2 bg-[#007AFF] hover:bg-[#0051D5] text-white rounded-full font-semibold text-sm transition-all duration-200 min-w-[80px]"
        >
          OPEN
        </button>
      );
    }

    return (
      <button
        onClick={() => handleInstall(app.appId)}
        className="px-6 py-2 bg-[#007AFF] hover:bg-[#0051D5] text-white rounded-full font-semibold text-sm transition-all duration-200 min-w-[80px]"
      >
        GET
      </button>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#F5F5F7]">
      {/* Navigation Bar */}
      <div className="bg-[#FBFBFD] border-b border-[#D1D1D6] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedApp && (
            <button 
              onClick={() => setSelectedApp(null)}
              className="text-[#007AFF] text-2xl hover:text-[#0051D5] transition-colors"
            >
              ◄
            </button>
          )}
          <h1 className="text-black text-2xl font-semibold">
            {selectedApp ? selectedApp.name : 'App Store'}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-gray-600 hover:text-black transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
          <button className="text-gray-600 hover:text-black transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {selectedApp ? (
        // App Detail View
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* App Header */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#E5E5EA]">
              <div className="flex items-start gap-6">
                {/* App Icon */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-3xl overflow-hidden shadow-lg border border-black/5 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <span className="text-8xl">{selectedApp.icon}</span>
                  </div>
                </div>

                {/* App Info */}
                <div className="flex-1">
                  <h2 className="text-black text-3xl font-bold mb-2">{selectedApp.name}</h2>
                  <p className="text-[#6E6E73] text-lg mb-3">{selectedApp.author}</p>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-yellow-500 text-xl">★★★★★</div>
                      <div className="text-[#6E6E73] text-xs">5.0</div>
                    </div>
                    <div className="text-center">
                      <div className="text-black text-xl font-semibold">v{selectedApp.version}</div>
                      <div className="text-[#6E6E73] text-xs">Version</div>
                    </div>
                    {selectedApp.requiresPin === 'yes' && (
                      <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
                        🔒 PIN Required
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    {renderButton(selectedApp)}
                    {isInstalled(selectedApp.appId) && (
                      <button
                        onClick={() => handleUninstall(selectedApp.appId)}
                        className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold text-sm transition-all duration-200"
                      >
                        Uninstall
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#E5E5EA]">
              <h3 className="text-black text-xl font-bold mb-4">About</h3>
              <p className="text-[#6E6E73] text-base leading-relaxed">
                {selectedApp.description}
              </p>
            </div>

            {/* Information Section */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#E5E5EA]">
              <h3 className="text-black text-xl font-bold mb-4">Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-[#E5E5EA]">
                  <span className="text-[#6E6E73]">Developer</span>
                  <span className="text-black font-medium">{selectedApp.author}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E5E5EA]">
                  <span className="text-[#6E6E73]">Version</span>
                  <span className="text-black font-medium">{selectedApp.version}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E5E5EA]">
                  <span className="text-[#6E6E73]">App ID</span>
                  <span className="text-black font-medium">{selectedApp.appId}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#6E6E73]">Security</span>
                  <span className="text-black font-medium">
                    {selectedApp.requiresPin === 'yes' ? 'PIN Protected' : 'Standard'}
                  </span>
                </div>
              </div>
            </div>

            {/* Ratings Section */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#E5E5EA]">
              <h3 className="text-black text-xl font-bold mb-4">Ratings & Reviews</h3>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-6xl font-bold text-black mb-1">5.0</div>
                  <div className="text-yellow-500 text-2xl mb-1">★★★★★</div>
                  <div className="text-[#6E6E73] text-sm">Based on user reviews</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Main App List View
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 space-y-8">
          
          {/* Featured Section */}
          {featuredApp && (
            <div>
              <h2 className="text-black text-xl font-semibold mb-4">Featured</h2>
              <div 
                className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => setSelectedApp(featuredApp)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-5xl">
                      {featuredApp.icon}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-1">{featuredApp.name}</h3>
                      <p className="text-white/90 text-sm mb-2">{featuredApp.description}</p>
                      <p className="text-white/70 text-xs">{featuredApp.author} • {featuredApp.version}</p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    {renderButton(featuredApp)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Apps Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-black text-xl font-semibold">Apps</h2>
              <button className="text-[#007AFF] text-sm font-medium hover:text-[#0051D5] transition-colors">
                See All →
              </button>
            </div>

            <div className="space-y-3">
              {availableApps.map(app => (
                <div
                  key={app.appId}
                  className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 border border-[#E5E5EA] cursor-pointer"
                  onClick={() => setSelectedApp(app)}
                >
                  <div className="flex items-center gap-4">
                    {/* App Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-sm border border-black/5 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                        <span className="text-5xl">{app.icon}</span>
                      </div>
                    </div>

                    {/* App Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-black text-lg font-bold mb-1">{app.name}</h3>
                      <p className="text-[#6E6E73] text-sm mb-2 line-clamp-1">{app.description}</p>
                      <div className="flex items-center gap-3 text-xs text-[#6E6E73]">
                        <span>{app.author}</span>
                        <span className="text-yellow-500">★★★★★</span>
                        <span>v{app.version}</span>
                        {app.requiresPin === 'yes' && (
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs">
                            🔒 PIN
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {renderButton(app)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {availableApps.length === 0 && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-[#6E6E73] text-lg">No applications available</p>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
