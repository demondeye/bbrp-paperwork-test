import { useState, useEffect } from 'react';
import { getAppStoreApps, isSystemApp } from '../../utils/appRegistry';
import { isOwner } from '../../utils/roles';
import AppIcon from '../../components/AppIcon';
import CircularProgress from '../../components/CircularProgress';

export default function AppStore({ user, installedApps = [], onInstallApp, onUninstallApp, onOpenApp }) {
  const [availableApps, setAvailableApps] = useState([]);
  const [installingApps, setInstallingApps] = useState(new Map()); // Map<appId, progress>
  const [uninstallingApps, setUninstallingApps] = useState(new Map()); // Map<appId, progress>
  const [featuredApp, setFeaturedApp] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null); // For detail view
  const [showUpload, setShowUpload] = useState(false);
  const [userIsOwner, setUserIsOwner] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Load available apps from registry using App Store API
    const apps = getAppStoreApps();
    setAvailableApps(apps);
    
    // Set first app as featured
    if (apps.length > 0) {
      setFeaturedApp(apps[0]);
    }
    
    // Check if user is owner
    checkOwnerStatus();
  }, [user]);
  
  async function checkOwnerStatus() {
    if (!user) {
      setUserIsOwner(false);
      return;
    }
    
    const owner = await isOwner(user);
    setUserIsOwner(owner);
  }
  
  async function handleUploadFiles() {
    if (uploadFiles.length === 0) {
      alert('Please select files to upload');
      return;
    }
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      uploadFiles.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await fetch('/api/upload-apps', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const result = await response.json();
      
      alert(`Upload successful!\n${result.message || 'Files uploaded'}`);
      
      // Clear selection
      setUploadFiles([]);
      setShowUpload(false);
      
      // Reload page to show new apps
      window.location.reload();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  const isInstalled = (appId) => {
    return installedApps.includes(appId);
  };

  const canUninstall = (appId) => {
    return !isSystemApp(appId);
  };

  const handleInstall = async (appId) => {
    // Initialize progress
    setInstallingApps(prev => new Map(prev).set(appId, 0));
    
    // Animate progress from 0 to 100 over 4 seconds
    const duration = 4000; // 4 seconds for more realistic install
    const steps = 80; // More steps for smoother animation
    const stepDuration = duration / steps;
    
    for (let i = 0; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepDuration));
      const progress = (i / steps) * 100;
      setInstallingApps(prev => new Map(prev).set(appId, progress));
    }
    
    // Ensure we show 100% before completing
    setInstallingApps(prev => new Map(prev).set(appId, 100));
    await new Promise(resolve => setTimeout(resolve, 400)); // Show 100% for 400ms
    
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
    
    // Animate progress from 0 to 100 over 2 seconds
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;
    
    for (let i = 0; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepDuration));
      const progress = (i / steps) * 100;
      setUninstallingApps(prev => new Map(prev).set(appId, progress));
    }
    
    // Ensure we show 100% before completing
    setUninstallingApps(prev => new Map(prev).set(appId, 100));
    await new Promise(resolve => setTimeout(resolve, 300)); // Show 100% for 300ms
    
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
      const progress = installingApps.get(app.appId) || uninstallingApps.get(app.appId);
      return (
        <button
          disabled
          className="px-6 py-1.5 bg-[#E8E8ED] text-[#86868B] rounded-full font-semibold text-[15px] cursor-not-allowed flex items-center gap-2 min-w-[76px] justify-center"
        >
          <CircularProgress 
            progress={progress} 
            size={18} 
            strokeWidth={2}
            color={isInstalling ? 'blue' : 'orange'}
          />
        </button>
      );
    }

    if (installed) {
      return (
        <button
          onClick={() => onOpenApp(app.appId)}
          className="px-6 py-1.5 bg-[#007AFF] hover:bg-[#0051D5] active:bg-[#004FC1] text-white rounded-full font-semibold text-[15px] transition-all duration-150 min-w-[76px] shadow-sm"
        >
          OPEN
        </button>
      );
    }

    return (
      <button
        onClick={() => handleInstall(app.appId)}
        className="px-6 py-1.5 bg-[#007AFF] hover:bg-[#0051D5] active:bg-[#004FC1] text-white rounded-full font-semibold text-[15px] transition-all duration-150 min-w-[76px] shadow-sm"
      >
        GET
      </button>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Navigation Bar - Exact iOS Style */}
      <div className="bg-white px-4 pt-3 pb-2 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          {selectedApp && (
            <button 
              onClick={() => setSelectedApp(null)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] transition-colors -ml-1"
            >
              <svg className="w-5 h-5 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h1 className="text-black text-[34px] font-bold tracking-tight leading-none">
            {selectedApp ? selectedApp.name : 'Today'}
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Owner Upload Button */}
          {userIsOwner && !selectedApp && (
            <button 
              onClick={() => setShowUpload(!showUpload)}
              className="px-3 py-1.5 bg-[#007AFF] hover:bg-[#0051D5] text-white rounded-full font-semibold text-sm transition-colors"
              title="Upload Apps (Owner Only)"
            >
              📤 Upload
            </button>
          )}
          
          <button className="w-10 h-10 rounded-full overflow-hidden bg-gray-300">
            <svg className="w-full h-full text-gray-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Upload Panel (Owner Only) */}
      {userIsOwner && showUpload && (
        <div className="bg-[#F2F2F7] border-b border-gray-200 px-4 py-4">
          <h2 className="text-lg font-semibold mb-3">Upload Apps & Registry</h2>
          <p className="text-sm text-gray-600 mb-3">
            Upload .zip (app files) and/or .reg (registry) files
          </p>
          
          <input
            type="file"
            multiple
            accept=".zip,.reg"
            onChange={(e) => setUploadFiles(Array.from(e.target.files))}
            className="mb-3 block w-full text-sm text-gray-600
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-[#007AFF] file:text-white
              hover:file:bg-[#0051D5]
              file:cursor-pointer cursor-pointer"
          />
          
          {uploadFiles.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-medium mb-1">Selected files:</p>
              <ul className="text-sm text-gray-600">
                {uploadFiles.map((file, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span>{file.name.endsWith('.zip') ? '📦' : '📄'}</span>
                    <span>{file.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex gap-2">
            <button
              onClick={handleUploadFiles}
              disabled={uploading || uploadFiles.length === 0}
              className="px-4 py-2 bg-[#007AFF] hover:bg-[#0051D5] disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Upload Files'}
            </button>
            <button
              onClick={() => {
                setShowUpload(false);
                setUploadFiles([]);
              }}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {selectedApp ? (
        // App Detail View - Match Image 3, 4, 5
        <div className="flex-1 overflow-y-auto bg-white">
          {/* Hero Section with GET button */}
          <div className="relative">
            {/* Background preview images */}
            <div className="flex gap-2 px-4 mb-4">
              <div className="w-[45%] h-[280px] rounded-2xl overflow-hidden bg-gradient-to-br from-orange-300 to-orange-100 flex items-center justify-center">
                <AppIcon 
                  icon={selectedApp.icon} 
                  iconType={selectedApp.iconType}
                  size="large"
                  className="w-32 h-32"
                />
              </div>
              <div className="w-[45%] h-[280px] rounded-2xl overflow-hidden bg-gradient-to-br from-blue-200 to-blue-50"></div>
            </div>

            {/* Floating icon and button */}
            <div className="absolute top-2 left-4 right-4 flex items-center justify-between">
              <div className="w-[72px] h-[72px] rounded-[18px] overflow-hidden shadow-lg bg-white border border-black/10 flex items-center justify-center">
                <AppIcon 
                  icon={selectedApp.icon} 
                  iconType={selectedApp.iconType}
                  size="large"
                  className="w-16 h-16"
                />
              </div>
              <div className="flex flex-col items-end gap-2">
                <div onClick={(e) => e.stopPropagation()}>
                  {renderButton(selectedApp)}
                </div>
                {isInstalled(selectedApp.appId) && canUninstall(selectedApp.appId) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUninstall(selectedApp.appId);
                    }}
                    className="px-4 py-1 bg-[#FF3B30] hover:bg-[#FF2D55] active:bg-[#FF1744] text-white rounded-full font-semibold text-[13px] transition-all shadow-sm"
                  >
                    Uninstall
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Platform compatibility */}
          <div className="px-4 py-3 border-b border-[#E5E5EA]">
            <div className="flex items-center gap-2 text-[#86868B]">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="5" y="2" width="14" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span className="text-[13px]">iPhone, iPad</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-around py-5 border-b border-[#E5E5EA]">
            <div className="text-center">
              <div className="text-[#86868B] text-[11px] font-semibold mb-1">40K RATINGS</div>
              <div className="text-[28px] font-semibold text-black leading-none mb-1">4.8</div>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-[#86868B] text-[10px]">★</span>
                ))}
              </div>
            </div>
            <div className="w-px h-10 bg-[#E5E5EA]"></div>
            <div className="text-center">
              <div className="text-[#86868B] text-[11px] font-semibold mb-1">AGES</div>
              <div className="text-[28px] font-semibold text-black leading-none">13+</div>
              <div className="text-[#86868B] text-[11px]">Years</div>
            </div>
            <div className="w-px h-10 bg-[#E5E5EA]"></div>
            <div className="text-center">
              <div className="text-[#86868B] text-[11px] font-semibold mb-1">DEVELOPER</div>
              <div className="text-[17px] font-semibold text-black leading-tight">{selectedApp.author}</div>
            </div>
          </div>

          {/* Description */}
          <div className="px-4 py-5 border-b border-[#E5E5EA]">
            <p className="text-[17px] text-black leading-relaxed">
              {selectedApp.description}
            </p>
          </div>

          {/* Developer Link */}
          <div className="px-4 py-4 border-b border-[#E5E5EA]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[#007AFF] text-[17px] font-semibold">{selectedApp.author}</div>
                <div className="text-[#86868B] text-[13px]">Developer</div>
              </div>
              <svg className="w-5 h-5 text-[#86868B]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Ratings & Reviews */}
          <div className="px-4 py-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[22px] font-bold text-black">Ratings & Reviews</h2>
              <svg className="w-5 h-5 text-[#86868B]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            
            <div className="flex items-end gap-6 mb-6">
              <div className="text-[56px] font-bold text-black leading-none">4.8</div>
              <div className="pb-2">
                <div className="flex gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-black text-[18px]">★</span>
                  ))}
                </div>
                <div className="text-[#86868B] text-[13px]">40K Ratings</div>
              </div>
            </div>

            {/* Most Helpful Reviews */}
            <h3 className="text-[20px] font-bold text-black mb-3">Most Helpful Reviews</h3>
            <div className="bg-[#F2F2F7] rounded-2xl p-4">
              <div className="font-semibold text-[17px] text-black mb-2">Great app!</div>
              <div className="flex items-center gap-2 mb-2">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-black text-[12px]">★</span>
                ))}
                <span className="text-[#86868B] text-[13px]">· 6y ago · User123</span>
              </div>
              <p className="text-[15px] text-[#86868B]">
                This app is fantastic! Highly recommend to anyone looking for {selectedApp.name}.
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Main App List View - Match Image 1 (Today Tab)
        <div className="flex-1 overflow-y-auto bg-[#F2F2F7]">
          <div className="px-4 pb-20">
            
            {/* Featured Card - Large Hero */}
            {featuredApp && (
              <div className="mt-4 mb-8">
                <div 
                  className="relative rounded-[22px] overflow-hidden shadow-lg cursor-pointer"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    minHeight: '420px'
                  }}
                  onClick={() => setSelectedApp(featuredApp)}
                >
                  <div className="absolute inset-0 p-6 flex flex-col justify-between">
                    {/* Top section */}
                    <div>
                      <div className="text-white/80 text-[12px] font-semibold uppercase tracking-wider mb-2">FEATURED</div>
                      <h2 className="text-white text-[40px] font-bold leading-tight mb-3">
                        {featuredApp.name}
                      </h2>
                      <p className="text-white/90 text-[17px] leading-snug max-w-md">
                        {featuredApp.description}
                      </p>
                    </div>

                    {/* Bottom section with app info */}
                    <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-3">
                        <div className="w-[58px] h-[58px] rounded-[14px] overflow-hidden shadow-md bg-white/10 backdrop-blur-sm flex items-center justify-center">
                          <AppIcon 
                            icon={featuredApp.icon} 
                            iconType={featuredApp.iconType}
                            size="medium"
                            className="w-full h-full"
                          />
                        </div>
                        <div>
                          <div className="text-white text-[15px] font-semibold">{featuredApp.name}</div>
                          <div className="text-white/70 text-[12px]">{featuredApp.author}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => isInstalled(featuredApp.appId) ? onOpenApp(featuredApp.appId) : handleInstall(featuredApp.appId)}
                        className="bg-white/90 hover:bg-white text-[#5E5CE6] px-7 py-2 rounded-full font-bold text-[15px] transition-all shadow-md backdrop-blur-sm"
                      >
                        {isInstalled(featuredApp.appId) ? 'OPEN' : 'Get'}
                      </button>
                    </div>
                  </div>

                  {/* Decorative background */}
                  <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full blur-2xl"></div>
                </div>
              </div>
            )}

            {/* Apps Section Header - Match iOS spacing */}
            <div className="mb-3">
              <h2 className="text-black text-[22px] font-bold">Apps</h2>
            </div>

            {/* App List - Clean iOS style */}
            <div className="bg-white rounded-[14px] overflow-hidden shadow-sm">
              {availableApps.map((app, index) => (
                <div
                  key={app.appId}
                  className="flex items-center gap-3 px-4 py-3 active:bg-[#F2F2F7] transition-colors cursor-pointer border-b border-[#E5E5EA] last:border-b-0"
                  onClick={() => setSelectedApp(app)}
                >
                  {/* App Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-[64px] h-[64px] rounded-[14px] overflow-hidden shadow-sm border border-black/[0.04] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                      <AppIcon 
                        icon={app.icon} 
                        iconType={app.iconType}
                        size="large"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* App Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-black text-[17px] font-semibold mb-0.5 leading-snug">{app.name}</h3>
                    <p className="text-[#86868B] text-[13px] mb-1 line-clamp-1">{app.description}</p>
                    <div className="flex items-center gap-1.5 text-[12px] text-[#86868B]">
                      <span>{app.author}</span>
                      <span className="text-[8px]">●</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[#FFCC00]">★</span>
                        <span>4.8</span>
                      </div>
                      {app.requiresPin === 'yes' && (
                        <>
                          <span className="text-[8px]">●</span>
                          <span>🔒</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {renderButton(app)}
                  </div>
                </div>
              ))}
            </div>

            {availableApps.length === 0 && (
              <div className="text-center py-20">
                <div className="text-7xl mb-3 opacity-20">📦</div>
                <p className="text-[#86868B] text-[17px]">No applications available</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
