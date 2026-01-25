import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import Desktop from './components/Desktop';
import WindowsStartup from './components/WindowsStartup';
import FirebaseLogin from './components/FirebaseLogin';
import LoginScreen from './components/LoginScreen';
import VicPolApp from './applications/vicpol-paperwork/VicPolApp';
import AppStore from './applications/app-store/AppStore';
import BrowserApp from './applications/browser/BrowserApp';
import LearningCenter from './applications/learning-center/LearningCenter';
import Window from './components/Window';
import { getAppById, getDefaultInstalledApps } from './utils/appRegistry';

function App() {
  const [user, setUser] = useState(null);
  const [showStartup, setShowStartup] = useState(false);
  const [showLoginScreen, setShowLoginScreen] = useState(false);
  const [openApplications, setOpenApplications] = useState([]);
  const [pinnedApps, setPinnedApps] = useState(() => {
    const saved = localStorage.getItem('pinnedApps');
    return saved ? JSON.parse(saved) : ['vicpol-paperwork']; // VicPol pinned by default
  });
  const [installedApps, setInstalledApps] = useState(getDefaultInstalledApps()); // Will be loaded from Firestore

  // Check for first visit and handle startup screen
  useEffect(() => {
    const hasVisited = localStorage.getItem('vicpol-has-visited');
    if (!hasVisited) {
      setShowStartup(true);
      localStorage.setItem('vicpol-has-visited', 'true');
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is logged in, get their profile
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userProfile = {
            uid: firebaseUser.uid,
            email: userData.email,
            username: userData.username,
            fullName: userData.fullName
          };
          
          // Load installed apps from Firestore
          if (userData.installedApps) {
            setInstalledApps(userData.installedApps);
          }
          
          setUser(userProfile);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
        // Reset to default when logged out
        setInstalledApps(getDefaultInstalledApps());
      }
    });

    return () => unsubscribe();
  }, []);

  // Save pinned apps to localStorage
  useEffect(() => {
    localStorage.setItem('pinnedApps', JSON.stringify(pinnedApps));
  }, [pinnedApps]);

  // Save installed apps to Firestore when changed (only if user is logged in)
  useEffect(() => {
    const saveInstalledApps = async () => {
      if (user && user.uid) {
        try {
          await setDoc(doc(db, 'users', user.uid), {
            installedApps: installedApps
          }, { merge: true }); // merge: true to not overwrite other fields
        } catch (error) {
          console.error('Error saving installed apps:', error);
        }
      }
    };

    saveInstalledApps();
  }, [installedApps, user]);

  const handleLogin = async (userData) => {
    // Show login screen immediately
    setShowLoginScreen(true);
    
    // Minimum display time for login screen
    const minDisplayTime = new Promise(resolve => setTimeout(resolve, 2500));
    
    // Wait for both the minimum time and any async operations
    await minDisplayTime;
    
    // Hide login screen and show desktop
    setShowLoginScreen(false);
  };

  const handleOpenApp = (appId) => {
    // Get app config from registry
    const appConfig = getAppById(appId);
    
    // If app doesn't exist in registry at all, reject
    if (!appConfig) {
      console.log('App not found in registry:', appId);
      return;
    }
    
    // System apps can always open (from registry)
    // User apps need to be installed
    if (!appConfig.isSystemApp && !installedApps.includes(appId)) {
      console.log('User app not installed:', appId);
      return;
    }

    // Check if app is already open
    const existingApp = openApplications.find(app => app.id === appId);
    
    if (existingApp) {
      // Bring to front / unminimize
      setOpenApplications(prev => 
        prev.map(app => 
          app.id === appId 
            ? { ...app, isMinimized: false, zIndex: Math.max(...prev.map(a => a.zIndex)) + 1 }
            : app
        )
      );
    } else {
      // Open new instance
      const newApp = {
        id: appId,
        name: appConfig.name,
        icon: appConfig.icon,
        isMinimized: false,
        zIndex: openApplications.length + 1
      };
      setOpenApplications(prev => [...prev, newApp]);
    }
  };

  const handleCloseApp = (appId) => {
    setOpenApplications(prev => prev.filter(app => app.id !== appId));
  };

  const handleCloseAllApps = () => {
    setOpenApplications([]);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setOpenApplications([]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleMinimizeApp = (appId) => {
    setOpenApplications(prev =>
      prev.map(app =>
        app.id === appId ? { ...app, isMinimized: !app.isMinimized } : app
      )
    );
  };

  const handleTaskbarIconClick = (appId) => {
    const app = openApplications.find(a => a.id === appId);
    console.log('Taskbar click:', appId, 'Found app:', app);
    
    if (app) {
      if (app.isMinimized) {
        console.log('Restoring minimized app');
        // Restore and bring to front
        setOpenApplications(prev =>
          prev.map(a =>
            a.id === appId
              ? { ...a, isMinimized: false, zIndex: Math.max(...prev.map(app => app.zIndex)) + 1 }
              : a
          )
        );
      } else {
        // Check if this app is already at the top (focused)
        const maxZIndex = Math.max(...openApplications.map(a => a.zIndex));
        const isAlreadyFocused = app.zIndex === maxZIndex;
        
        if (isAlreadyFocused) {
          console.log('Minimizing focused app');
          // If already focused, minimize it
          setOpenApplications(prev =>
            prev.map(a => (a.id === appId ? { ...a, isMinimized: true } : a))
          );
        } else {
          console.log('Bringing unfocused app to front');
          // If not focused, bring it to front
          setOpenApplications(prev =>
            prev.map(a =>
              a.id === appId
                ? { ...a, zIndex: maxZIndex + 1 }
                : a
            )
          );
        }
      }
    } else {
      console.log('Opening new app');
      // Open new instance
      handleOpenApp(appId);
    }
  };

  const handlePinApp = (appId) => {
    if (!pinnedApps.includes(appId)) {
      setPinnedApps(prev => [...prev, appId]);
    }
  };

  const handleUnpinApp = (appId) => {
    setPinnedApps(prev => prev.filter(id => id !== appId));
  };

  const handleCloseAllAppsByAppId = (appId) => {
    setOpenApplications(prev => prev.filter(app => app.id !== appId));
  };

  const handleInstallApp = (appId) => {
    if (!installedApps.includes(appId)) {
      setInstalledApps(prev => [...prev, appId]);
      console.log('Installed app:', appId);
    }
  };

  const handleUninstallApp = (appId) => {
    // Don't allow uninstalling app-store itself
    if (appId === 'app-store') {
      alert('Cannot uninstall App Store');
      return;
    }
    
    setInstalledApps(prev => prev.filter(id => id !== appId));
    // Also close any open instances
    handleCloseAllAppsByAppId(appId);
    // Unpin if pinned
    if (pinnedApps.includes(appId)) {
      handleUnpinApp(appId);
    }
    console.log('Uninstalled app:', appId);
  };

  // Show startup screen
  if (showStartup) {
    return (
      <WindowsStartup 
        onComplete={() => {
          setShowStartup(false);
        }} 
      />
    );
  }

  // Show login if no user
  if (!user) {
    return <FirebaseLogin onLogin={handleLogin} />;
  }

  // Show login screen (transition screen)
  if (showLoginScreen) {
    return <LoginScreen username={user.fullName} />;
  }

  // Show desktop with applications
  return (
    <>
      <Desktop 
        user={user}
        onOpenApp={handleOpenApp}
        openApplications={openApplications}
        pinnedApps={pinnedApps}
        onTaskbarAppClick={handleTaskbarIconClick}
        onCloseAllApps={handleCloseAllApps}
        onLogout={handleLogout}
        onPinApp={handlePinApp}
        onUnpinApp={handleUnpinApp}
        onCloseAllAppsByAppId={handleCloseAllAppsByAppId}
        installedApps={installedApps}
      />

      {/* Render open applications */}
      {openApplications.map(app => {
        if (app.id === 'vicpol-paperwork') {
          return (
            <VicPolApp
              key={app.id}
              user={user}
              onClose={() => handleCloseApp(app.id)}
              onMinimize={() => handleMinimizeApp(app.id)}
              isMinimized={app.isMinimized}
              zIndex={app.zIndex}
            />
          );
        }
        
        if (app.id === 'app-store') {
          return (
            <Window
              key={app.id}
              title={app.name}
              icon={app.icon}
              onClose={() => handleCloseApp(app.id)}
              onMinimize={() => handleMinimizeApp(app.id)}
              isMinimized={app.isMinimized}
              zIndex={app.zIndex}
              defaultWidth={1200}
              defaultHeight={800}
              startMaximized={false}
            >
              <AppStore
                user={user}
                installedApps={installedApps}
                onInstallApp={handleInstallApp}
                onUninstallApp={handleUninstallApp}
                onOpenApp={handleOpenApp}
              />
            </Window>
          );
        }
        
        if (app.id === 'browser') {
          return (
            <Window
              key={app.id}
              title={app.name}
              icon={app.icon}
              onClose={() => handleCloseApp(app.id)}
              onMinimize={() => handleMinimizeApp(app.id)}
              isMinimized={app.isMinimized}
              zIndex={app.zIndex}
              defaultWidth={1400}
              defaultHeight={900}
              startMaximized={false}
            >
              <BrowserApp
                user={user}
                onClose={() => handleCloseApp(app.id)}
                onMinimize={() => handleMinimizeApp(app.id)}
                isMinimized={app.isMinimized}
                zIndex={app.zIndex}
              />
            </Window>
          );
        }
        
        if (app.id === 'learning-center') {
          return (
            <Window
              key={app.id}
              title={app.name}
              icon={app.icon}
              onClose={() => handleCloseApp(app.id)}
              onMinimize={() => handleMinimizeApp(app.id)}
              isMinimized={app.isMinimized}
              zIndex={app.zIndex}
              defaultWidth={1200}
              defaultHeight={800}
              startMaximized={false}
            >
              <LearningCenter user={user} />
            </Window>
          );
        }
        
        return null;
      })}
    </>
  );
}

export default App;
