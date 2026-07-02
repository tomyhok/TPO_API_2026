import { useState } from 'react';
import styles from '../../styles/ui/TeamLogo.module.css';

const TeamLogo = ({ src, alt, className = "", fallbackClassName = "", fallbackIcon = "🛡️" }) => {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    return (
      <div className={`${styles.fallbackContainer} ${fallbackClassName} ${className}`}>
        {fallbackIcon}
      </div>
    );
  }

  return (
    <div className={`${styles.logoContainer} ${className}`}>
      <img 
        src={src} 
        alt={alt || "Team Logo"} 
        className={styles.img}
        onError={() => setImageError(true)}
      />
    </div>
  );
};

export default TeamLogo;
