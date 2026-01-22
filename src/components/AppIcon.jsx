export default function AppIcon({ icon, iconType = 'emoji', size = 'medium', className = '' }) {
  const sizeClasses = {
    small: 'text-xl w-8 h-8',
    medium: 'text-5xl w-16 h-16',
    large: 'text-7xl w-24 h-24'
  };

  if (iconType === 'image') {
    return (
      <img 
        src={icon} 
        alt="App icon"
        className={`${sizeClasses[size]} object-contain ${className}`}
      />
    );
  }

  // Emoji icon
  return (
    <div className={`${sizeClasses[size]} flex items-center justify-center ${className}`}>
      <span className={sizeClasses[size].split(' ')[0]}>{icon}</span>
    </div>
  );
}
