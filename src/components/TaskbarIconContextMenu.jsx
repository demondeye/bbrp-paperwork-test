import { useEffect } from 'react';

export default function TaskbarIconContextMenu({ x, y, onClose, appId, isPinned, isOpen, onPin, onUnpin, onCloseWindow }) {
  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <>
      <div 
        className="fixed inset-0 z-[200]" 
        onClick={onClose}
        onContextMenu={(e) => e.preventDefault()}
      />
      <div 
        className="fixed z-[201] bg-[#2d2d2d]/98 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl py-2 min-w-[200px]"
        style={{ left: x, top: y }}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Pin/Unpin option */}
        <button 
          className="w-full px-4 py-2 hover:bg-white/10 transition-colors text-left flex items-center gap-3 text-white text-sm"
          onClick={() => {
            if (isPinned) {
              onUnpin(appId);
            } else {
              onPin(appId);
            }
            onClose();
          }}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 3a1 1 0 011 1v5h3a1 1 0 110 2h-3v5a1 1 0 11-2 0v-5H6a1 1 0 110-2h3V4a1 1 0 011-1z" />
          </svg>
          {isPinned ? 'Unpin from taskbar' : 'Pin to taskbar'}
        </button>

        {/* Close option - only show if app is open */}
        {isOpen && (
          <>
            <div className="h-px bg-white/10 my-2"></div>
            <button 
              className="w-full px-4 py-2 hover:bg-white/10 transition-colors text-left flex items-center gap-3 text-white text-sm"
              onClick={() => {
                onCloseWindow(appId);
                onClose();
              }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Close window
            </button>
          </>
        )}
      </div>
    </>
  );
}
