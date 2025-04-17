import React, { useState, useEffect } from 'react';

const AnimatedContent = ({ content, onComplete }) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const words = content ? content.split(' ') : [];

  useEffect(() => {
    if (!content) return;

    const interval = setInterval(() => {
      if (currentIndex < words.length) {
        setDisplayedContent(prev => prev + (currentIndex > 0 ? ' ' : '') + words[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 10); // Adjust speed here (lower number = faster)

    return () => clearInterval(interval);
  }, [content, currentIndex, words, onComplete]);

  return (
    <div className="prose max-w-none">
      {displayedContent}
      <span className="animate-pulse">|</span>
    </div>
  );
};

export default AnimatedContent;
