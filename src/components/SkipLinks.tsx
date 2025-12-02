import React from 'react';

const SkipLinks = () => {
  return (
    <div className="skip-links">
      <a 
        href="#main-content" 
        className="skip-link"
        aria-label="Ana içeriğe atla"
      >
        Ana içeriğe atla
      </a>
      <a 
        href="#main-navigation" 
        className="skip-link"
        aria-label="Ana menüye atla"
      >
        Ana menüye atla
      </a>
    </div>
  );
};

export default SkipLinks;
