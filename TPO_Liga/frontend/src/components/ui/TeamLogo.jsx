import { useState } from 'react';

const TeamLogo = ({ src, alt, className = "", fallbackClassName = "", fallbackIcon = "🛡️" }) => {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    return (
      <div className={`flex items-center justify-center bg-stone-100 border border-stone-200/50 text-stone-400 ${fallbackClassName} ${className}`}>
        {fallbackIcon}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center bg-white border border-stone-200/50 overflow-hidden ${className}`}>
      <img 
        src={src} 
        alt={alt || "Team Logo"} 
        className="w-full h-full object-contain scale-[0.8]"
        onError={() => setImageError(true)}
      />
    </div>
  );
};

export default TeamLogo;
