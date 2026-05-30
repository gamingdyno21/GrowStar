import React, { useState, useEffect } from 'react';
import BrandLogo from './BrandLogo';

const BrandedPreloader = ({ onComplete }) => {
  const [phase, setPhase] = useState('pulse'); // 'pulse' | 'spin-scale'
  const [typedText, setTypedText] = useState('');
  const [subtitleVisible, setSubtitleVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  const fullText = 'GROWSTAR';

  useEffect(() => {
    // Phase 1: Logo pulse (Active on mount)
    
    // Phase 2: Logo spin/scale at 500ms
    const spinTimer = setTimeout(() => {
      setPhase('spin-scale');
    }, 550);

    // Phase 3: Typing text starts at 950ms
    const typeStartTimer = setTimeout(() => {
      let currentIdx = 0;
      const typeInterval = setInterval(() => {
        if (currentIdx <= fullText.length) {
          setTypedText(fullText.slice(0, currentIdx));
          currentIdx++;
        } else {
          clearInterval(typeInterval);
        }
      }, 70); // 70ms per letter

      return () => clearInterval(typeInterval);
    }, 950);

    // Phase 4: Subtitle fades in at 1550ms
    const subtitleTimer = setTimeout(() => {
      setSubtitleVisible(true);
    }, 1550);

    // Phase 5: Fade out container starts at 2000ms
    const fadeOutTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2000);

    // Unmount/Complete call at 2500ms
    const completeTimer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 2500);

    return () => {
      clearTimeout(spinTimer);
      clearTimeout(typeStartTimer);
      clearTimeout(subtitleTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className={`preloader-overlay ${fadeOut ? 'fade-out' : ''}`}>
      <div className="text-center">
        {/* Phase 1 & 2: Brand Logo */}
        <div className="preloader-logo-wrapper">
          <BrandLogo
            width={72}
            height={72}
            className={`preloader-logo ${phase === 'pulse' ? 'pulse' : 'spin-scale'}`}
          />
        </div>

        {/* Phase 3: Typed Brand Name */}
        <h1 className="preloader-title">
          <span>{typedText}</span>
        </h1>

        {/* Phase 4: Slogan Fades In */}
        <div className={`preloader-subtitle ${subtitleVisible ? 'visible' : ''}`}>
          Grow Smarter. Invest Stronger.
        </div>
      </div>
    </div>
  );
};

export default BrandedPreloader;
