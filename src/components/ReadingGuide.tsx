import { useEffect, useState } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

const ReadingGuide = () => {
  const { settings } = useAccessibility();
  const [mouseY, setMouseY] = useState(0);

  useEffect(() => {
    if (!settings.readingGuide) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMouseY(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [settings.readingGuide]);

  if (!settings.readingGuide) return null;

  return (
    <div 
      className="reading-guide-line"
      style={{ top: `${mouseY}px` }}
      aria-hidden="true"
    />
  );
};

export default ReadingGuide;
