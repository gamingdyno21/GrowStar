import React, { useState, useEffect } from 'react';
import BrandLogo from './BrandLogo';

const BrandedPreloader = ({ onComplete }) => {
  const [phase, setPhase] = useState('pulse'); // 'pulse' | 'spin-scale'
  const [typedText, setTypedText] = useState('');
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  const fullText = 'GROWSTAR';

  useEffect(() => {
    // Phase 2: Logo spin/scale at 400ms
    const spinTimer = setTimeout(() => { setPhase('spin-scale'); }, 400);

    // Phase 3: Typing text at 700ms
    const typeStartTimer = setTimeout(() => {
      let idx = 0;
      const typeInterval = setInterval(() => {
        if (idx <= fullText.length) {
          setTypedText(fullText.slice(0, idx));
          setProgress(Math.round((idx / fullText.length) * 100));
          idx++;
        } else {
          clearInterval(typeInterval);
        }
      }, 50);
      return () => clearInterval(typeInterval);
    }, 700);

    // Phase 4: Fade out at 1500ms
    const fadeOutTimer = setTimeout(() => { setFadeOut(true); }, 1500);

    // Complete at 2000ms
    const completeTimer = setTimeout(() => { onComplete?.(); }, 2000);

    return () => {
      clearTimeout(spinTimer);
      clearTimeout(typeStartTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className={`preloader-overlay ${fadeOut ? 'fade-out' : ''}`}>
      <div className="preloader-content">
        <div className="preloader-logo-wrapper">
          <BrandLogo
            width={72}
            height={72}
            className={`preloader-logo ${phase === 'pulse' ? 'pulse' : 'spin-scale'}`}
          />
        </div>

        <h1 className="preloader-title">
          <span>{typedText}</span>
        </h1>

        {/* Progress bar */}
        <div className="preloader-track">
          <div className="preloader-bar" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
    </div>
  );
};

export default BrandedPreloader;
