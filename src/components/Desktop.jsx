import { useState, useEffect } from 'react';
import StartMenu from './StartMenu';
import UserMenu from './UserMenu';
import PowerMenu from './PowerMenu';
import UserSettings from './UserSettings';
import WindowsStartup from './WindowsStartup';
import DesktopContextMenu from './DesktopContextMenu';
import TaskbarContextMenu from './TaskbarContextMenu';
import TaskbarIconContextMenu from './TaskbarIconContextMenu';
import ShutdownScreen from './ShutdownScreen';
import AppIcon from './AppIcon';
import AboutDialog from './AboutDialog';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getUserBackground } from '../cloudinary';
import { getAppById, getSystemApps, getDesktopApps } from '../utils/appRegistry';

export default function Desktop({ user, onLogout, onOpenApp, openApplications = [], pinnedApps = [], installedApps = [], onTaskbarAppClick, onCloseAllApps, onPinApp, onUnpinApp, onCloseAllAppsByAppId }) {
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPowerMenu, setShowPowerMenu] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoggingOff, setIsLoggingOff] = useState(false);
  const [isLoggingOn, setIsLoggingOn] = useState(false);
  const [isShuttingDown, setIsShuttingDown] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [showStartupSequence, setShowStartupSequence] = useState(false);
  const [showShutdownScreen, setShowShutdownScreen] = useState(false);
  const [desktopContextMenu, setDesktopContextMenu] = useState(null);
  const [menuUpdateCounter, setMenuUpdateCounter] = useState(0);
  const [taskbarContextMenu, setTaskbarContextMenu] = useState(null);
  const [taskbarIconContextMenu, setTaskbarIconContextMenu] = useState(null);
  const [userSettings, setUserSettings] = useState({
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #7e22ce 100%)'
  });
  const [previewSettings, setPreviewSettings] = useState(null); // Separate preview state

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load user settings from Firestore
  useEffect(() => {
    const loadSettings = async () => {
      if (user && user.uid) {
        try {
          // Load settings from Firestore
          const settingsDoc = await getDoc(doc(db, 'userSettings', user.uid));
          let settings = settingsDoc.exists() ? settingsDoc.data() : {
            background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #7e22ce 100%)'
          };
          
          // If settings already have a cloudinary URL, use it (no need to search)
          // The URL is already stored with the correct background styling
          if (settings.cloudinaryImageUrl) {
            // Settings already contain the full background with overlay, just use them
            setUserSettings(settings);
          } else {
            // Fallback: try to load background from Cloudinary by userId (for backwards compatibility)
            const cloudinaryBg = await getUserBackground(user.uid);
            if (cloudinaryBg) {
              // Apply the Cloudinary background with opacity overlay and cache-busting
              const timestamp = new Date().getTime();
              const bgUrlWithCache = `${cloudinaryBg}?v=${timestamp}`;
              settings.background = `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url(${bgUrlWithCache})`;
              settings.backgroundSize = 'cover';
              settings.backgroundPosition = 'center';
              settings.cloudinaryImageUrl = bgUrlWithCache;
            }
            setUserSettings(settings);
          }
        } catch (error) {
          console.error('Error loading user settings:', error);
        }
      }
    };
    loadSettings();

    // Listen for preview settings changes (temporary, not saved)
    const handlePreview = (e) => {
      setPreviewSettings(e.detail); // Store in preview state only
    };
    window.addEventListener('previewSettings', handlePreview);

    // Listen for window clicks to close Start Menu
    const handleWindowClick = () => {
      setShowStartMenu(false);
      setShowUserMenu(false);
      setShowPowerMenu(false);
    };
    window.addEventListener('windowClicked', handleWindowClick);

    return () => {
      window.removeEventListener('previewSettings', handlePreview);
      window.removeEventListener('windowClicked', handleWindowClick);
    };
  }, [user]);

  const handleSaveSettings = async (newSettings) => {
    // Clear preview and save to actual settings
    setPreviewSettings(null);
    setUserSettings(newSettings);
    
    // Save to Firestore
    if (user && user.uid) {
      try {
        await setDoc(doc(db, 'userSettings', user.uid), newSettings);
        console.log('Settings saved to Firestore successfully');
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    }
  };

  const handleCancelSettings = () => {
    // Clear preview, keep original settings
    setPreviewSettings(null);
  };

  const formatTime = () => {
    return currentTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('en-US', { 
      month: 'numeric', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleLogoff = () => {
    // Close all menus
    setShowStartMenu(false);
    setShowUserMenu(false);
    setShowPowerMenu(false);
    setShowUserSettings(false);
    setDesktopContextMenu(null);
    setTaskbarContextMenu(null);
    
    // Close all open applications
    if (onCloseAllApps) {
      onCloseAllApps();
    }
    
    setIsLoggingOff(true);
    
    // Simulate Windows logoff screen (realistic time: 10 seconds)
    setTimeout(() => {
      onLogout();
      setIsLoggingOff(false);
    }, 10000);
  };

  const handleShutdown = () => {
    // Close all menus
    setShowStartMenu(false);
    setShowUserMenu(false);
    setShowPowerMenu(false);
    setShowUserSettings(false);
    setDesktopContextMenu(null);
    setTaskbarContextMenu(null);
    
    // Close all open applications
    if (onCloseAllApps) {
      onCloseAllApps();
    }
    
    setIsShuttingDown(true);
    
    // Simulate Windows shutdown screen (realistic time: 30 seconds)
    setTimeout(() => {
      setIsShuttingDown(false);
      // Show black screen with power button
      setShowShutdownScreen(true);
    }, 30000);
  };

  const handleRestart = () => {
    // Close all menus
    setShowStartMenu(false);
    setShowUserMenu(false);
    setShowPowerMenu(false);
    setShowUserSettings(false);
    setDesktopContextMenu(null);
    setTaskbarContextMenu(null);
    
    // Close all open applications
    if (onCloseAllApps) {
      onCloseAllApps();
    }
    
    setIsRestarting(true);
    
    // Simulate restart: shutdown (60 seconds) then startup (90 seconds)
    setTimeout(() => {
      setIsRestarting(false);
      setShowStartupSequence(true);
    }, 60000); // 60 seconds shutdown time
  };

  const handlePowerOn = () => {
    setShowShutdownScreen(false);
    setShowStartupSequence(true);
  };

  // Desktop apps - Show ALL apps from registry (system + user installed)
  // If it's on the desktop, it should be openable
  const systemApps = getSystemApps().map(app => ({
    ...app,
    id: app.appId
  }));
  
  const userApps = installedApps
    .filter(appId => !getSystemApps().find(sysApp => sysApp.appId === appId)) // Exclude system apps
    .map(appId => {
      const appConfig = getAppById(appId);
      return appConfig ? { ...appConfig, id: appConfig.appId } : null;
    })
    .filter(Boolean);
  
  const desktopApps = [...systemApps, ...userApps];

  // Add decorative system icons (This PC, About, Recycle Bin)
  const decorativeIcons = [
    { 
      name: 'This PC', 
      icon: '💻',
      iconType: 'emoji',
      id: 'pc'
    },
    { 
      name: 'About', 
      icon: 'ℹ️',
      iconType: 'emoji',
      id: 'about'
    },
    { 
      name: 'Recycle Bin', 
      icon: '🗑️',
      iconType: 'emoji',
      id: 'recycle'
    }
  ];

  const allDesktopIcons = [...desktopApps, ...decorativeIcons];

  const handleAppClick = (appId) => {
    if (appId === 'about') {
      // About - Opens About dialog
      setShowAbout(true);
    } else if (appId === 'pc' || appId === 'recycle') {
      // Decorative icons - do nothing
      return;
    } else {
      // Try to open any app that exists in the registry
      const appConfig = getAppById(appId);
      if (appConfig) {
        onOpenApp(appId);
      }
    }
  };

  // Shutdown Screen
  if (showShutdownScreen) {
    return <ShutdownScreen onPowerOn={handlePowerOn} />;
  }

  // Startup Sequence
  if (showStartupSequence) {
    return <WindowsStartup onComplete={() => setShowStartupSequence(false)+onLogout()} />;
  }

  // Logoff Screen
  if (isLoggingOff) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0078d4]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
          <div className="text-white text-2xl font-light">Signing out...</div>
        </div>
      </div>
    );
  }

   // Logon Screen
  if (isLoggingOn) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0078d4]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
          <div className="text-white text-2xl font-light">Signing in...</div>
        </div>
      </div>
    );
  }

  // Shutdown Screen
  if (isShuttingDown) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0078d4]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
          <div className="text-white text-2xl font-light mb-2">Shutting down...</div>
          <div className="text-white/70 text-sm">Please don't turn off your computer</div>
        </div>
      </div>
    );
  }

  // Restarting Screen
  if (isRestarting) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0078d4]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
          <div className="text-white text-2xl font-light mb-2">Restarting...</div>
          <div className="text-white/70 text-sm">Please wait</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col relative overflow-hidden">
      {/* Desktop Background */}
      <div 
        className="flex-1 relative"
        style={{
          backgroundImage: (previewSettings || userSettings).background,
          backgroundSize: (previewSettings || userSettings).backgroundSize || 'cover',
          backgroundPosition: (previewSettings || userSettings).backgroundPosition || 'center',
          backgroundRepeat: (previewSettings || userSettings).backgroundRepeat || 'no-repeat'
        }}
        onClick={() => {
          setShowStartMenu(false);
          setShowUserMenu(false);
          setShowPowerMenu(false);
          setDesktopContextMenu(null);
          setTaskbarContextMenu(null);
          setTaskbarIconContextMenu(null);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const newPosition = { x: e.clientX, y: e.clientY };
          
          console.log('=== RIGHT CLICK DETECTED ===');
          console.log('Current menu state:', desktopContextMenu);
          console.log('New position:', newPosition);
          
          // Close other menus
          setShowStartMenu(false);
          setShowUserMenu(false);
          setShowPowerMenu(false);
          setTaskbarContextMenu(null);
          setTaskbarIconContextMenu(null);
          
          // ALWAYS set the new position and increment counter
          setDesktopContextMenu(newPosition);
          setMenuUpdateCounter(prev => prev + 1);
          
          console.log('Menu updated. Counter:', menuUpdateCounter + 1);
        }}
      >
        {/* Desktop Icons */}
        <div className="p-4 grid grid-cols-1 gap-4 auto-rows-min w-32">
          {allDesktopIcons.map(app => (
            <button
              key={app.id}
              className="flex flex-col items-center gap-1 p-2 rounded hover:bg-white/10 transition-colors group"
              onDoubleClick={() => handleAppClick(app.id)}
              onContextMenu={(e) => {
                // Allow context menu to bubble up to desktop
                // Don't stop propagation so desktop context menu shows
              }}
            >
              <AppIcon 
                icon={app.icon} 
                iconType={app.iconType || 'emoji'} 
                size="medium"
              />
              <div className="text-white text-xs text-center font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] group-hover:bg-blue-500/50 px-1 rounded">
                {app.name}
              </div>
            </button>
          ))}
        </div>

        {/* Welcome Message */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <div className="text-white/90 text-6xl font-light drop-shadow-2xl mb-4">
            {formatTime()}
          </div>
          <div className="text-white/80 text-2xl font-light drop-shadow-xl">
            {formatDate()}
          </div>
          <div className="text-white/70 text-xl font-light drop-shadow-xl mt-8">
            Welcome, {user.fullName}
          </div>
        </div>
      </div>

      {/* Desktop Context Menu */}
      {desktopContextMenu && (
        <DesktopContextMenu
          key={menuUpdateCounter}
          x={desktopContextMenu.x}
          y={desktopContextMenu.y}
          onClose={() => setDesktopContextMenu(null)}
          onOpenSettings={() => {
            setShowUserSettings(true);
            setDesktopContextMenu(null);
          }}
        />
      )}

      {/* Taskbar Context Menu */}
      {taskbarContextMenu && (
        <TaskbarContextMenu
          x={taskbarContextMenu.x}
          y={taskbarContextMenu.y}
          onClose={() => setTaskbarContextMenu(null)}
        />
      )}

      {/* Taskbar Icon Context Menu */}
      {taskbarIconContextMenu && (
        <TaskbarIconContextMenu
          x={taskbarIconContextMenu.x}
          y={taskbarIconContextMenu.y}
          appId={taskbarIconContextMenu.appId}
          isPinned={taskbarIconContextMenu.isPinned}
          isOpen={taskbarIconContextMenu.isOpen}
          onClose={() => setTaskbarIconContextMenu(null)}
          onPin={onPinApp}
          onUnpin={onUnpinApp}
          onCloseWindow={onCloseAllAppsByAppId}
        />
      )}

      {/* Start Menu */}
      {showStartMenu && (
        <StartMenu 
          user={user} 
          onClose={() => setShowStartMenu(false)}
          onLogout={handleLogoff}
          onShutdown={handleShutdown}
          onOpenApp={onOpenApp}
          onOpenUserMenu={() => {
            // If PowerMenu is open, close it first
            if (showPowerMenu) {
              setShowPowerMenu(false);
            }
            // Toggle UserMenu
            setShowUserMenu(prev => !prev);
            // Keep Start Menu open
          }}
          onOpenPowerMenu={() => {
            // If UserMenu is open, close it first
            if (showUserMenu) {
              setShowUserMenu(false);
            }
            // Toggle PowerMenu
            setShowPowerMenu(prev => !prev);
            // Keep Start Menu open
          }}
        />
      )}

      {/* User Menu */}
      {showUserMenu && (
        <UserMenu
          user={user}
          onClose={() => {
            setShowUserMenu(false);
            setShowStartMenu(false);  // Close Start Menu when UserMenu closes
          }}
          onOpenSettings={() => {
            setShowUserSettings(true);
            setShowUserMenu(false);
            setShowStartMenu(false);  // Close Start Menu when opening settings
          }}
          onLogout={handleLogoff}
        />
      )}

      {/* Power Menu */}
      {showPowerMenu && (
        <PowerMenu
          onClose={() => setShowPowerMenu(false)}
          onShutdown={handleShutdown}
          onRestart={handleRestart}
        />
      )}

      {/* User Settings */}
      {showUserSettings && (
        <UserSettings
          user={user}
          settings={userSettings}
          onSave={handleSaveSettings}
          onClose={() => {
            handleCancelSettings();
            setShowUserSettings(false);
          }}
        />
      )}

      {/* Taskbar */}
      <div 
        className="h-12 bg-[#1a1a1a]/95 backdrop-blur-sm border-t border-white/10 flex items-center px-2 gap-2"
        onClick={(e) => {
          // Close Start Menu when clicking anywhere on taskbar (except Start button)
          if (!e.target.closest('.start-button')) {
            setShowStartMenu(false);
            setShowUserMenu(false);
            setShowPowerMenu(false);
            setDesktopContextMenu(null);
            setTaskbarContextMenu(null);
            setTaskbarIconContextMenu(null);
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          // Close all other menus
          setShowStartMenu(false);
          setShowUserMenu(false);
          setShowPowerMenu(false);
          setDesktopContextMenu(null);
          setTaskbarIconContextMenu(null);
          // Position taskbar menu from bottom
          const menuHeight = 100; // Approximate height
          setTaskbarContextMenu({ 
            x: e.clientX, 
            y: e.clientY - menuHeight 
          });
        }}
      >
        {/* Start Button */}
        <button
          className="start-button h-full px-3 hover:bg-white/10 transition-colors flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            // Toggle Start Menu
            const newState = !showStartMenu;
            setShowStartMenu(newState);
            
            // If closing Start Menu, also close all sub-menus
            if (!newState) {
              setShowUserMenu(false);
              setShowPowerMenu(false);
            }
          }}
        >
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/>
          </svg>
        </button>

        {/* Search Box */}
        <div className="flex-1 max-w-md">
          <div className="h-8 bg-white/5 border border-white/10 rounded flex items-center px-3 gap-2">
            <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Type here to search"
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/40"
              readOnly
            />
          </div>
        </div>

        {/* Taskbar Icons - Pinned and Open Applications */}
        <div className="flex items-center gap-1">
          {[...new Set([...pinnedApps, ...openApplications.map(app => app.id)])].map(appId => {
            const openApp = openApplications.find(app => app.id === appId);
            const isOpen = !!openApp;
            const isMinimized = openApp?.isMinimized || false;
            
            // Get app config from registry
            const appConfig = getAppById(appId);
            if (!appConfig) return null;
            
            return (
              <button 
                key={appId}
                className={`h-10 w-10 hover:bg-white/10 transition-colors flex items-center justify-center rounded relative ${
                  isOpen && !isMinimized ? 'bg-white/5' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onTaskbarAppClick && onTaskbarAppClick(appId);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDesktopContextMenu(null);
                  setTaskbarContextMenu(null);
                  setTaskbarIconContextMenu({
                    x: e.clientX,
                    y: e.clientY - 150, // Position above taskbar
                    appId,
                    isPinned: pinnedApps.includes(appId),
                    isOpen
                  });
                }}
                title={appConfig.name}
              >
                <AppIcon 
                  icon={appConfig.icon} 
                  iconType={appConfig.iconType} 
                  size="small"
                  className="text-xl"
                />
                {/* Indicator dot for open windows */}
                {isOpen && (
                  <div className="absolute bottom-0.5 w-1 h-1 bg-blue-400 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1"></div>

        {/* System Tray */}
        <div className="flex items-center gap-2">
          {/* Volume */}
          <button className="h-10 px-2 hover:bg-white/10 transition-colors flex items-center justify-center rounded">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 3.75a.75.75 0 00-1.264-.546L4.703 7H3.167a.75.75 0 00-.7.48A6.985 6.985 0 002 10c0 .887.165 1.737.468 2.52.111.29.39.48.7.48h1.535l4.033 3.796A.75.75 0 0010 16.25V3.75zM15.95 5.05a.75.75 0 00-1.06 1.061 5.5 5.5 0 010 7.778.75.75 0 001.06 1.06 7 7 0 000-9.899z" />
            </svg>
          </button>

          {/* Network */}
          <button className="h-10 px-2 hover:bg-white/10 transition-colors flex items-center justify-center rounded">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M16.364 3.636a.75.75 0 00-1.06 0 9 9 0 000 12.728.75.75 0 101.06-1.06 7.5 7.5 0 010-10.607.75.75 0 000-1.061zm-14.668 0a.75.75 0 010 1.06 7.5 7.5 0 000 10.608.75.75 0 01-1.06 1.06 9 9 0 010-12.728.75.75 0 011.06 0z" />
            </svg>
          </button>

          {/* Date/Time */}
          <button className="h-10 px-3 hover:bg-white/10 transition-colors flex flex-col items-end justify-center rounded">
            <div className="text-white text-xs leading-tight">{formatTime()}</div>
            <div className="text-white/70 text-xs leading-tight">{formatDate()}</div>
          </button>

          {/* Notifications */}
          <button className="h-10 px-2 hover:bg-white/10 transition-colors flex items-center justify-center rounded">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
          </button>
        </div>
      </div>

      {/* About Dialog */}
      {showAbout && <AboutDialog onClose={() => setShowAbout(false)} />}
    </div>
  );
}
