import React from 'react';

const BrandLogo = ({ width = 28, height = 28, className = '' }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      {/* 4-pointed star outline/accent representing the financial star */}
      <path
        d="M12 2L14.5 8.5L21 11L14.5 13.5L12 20L9.5 13.5L3 11L9.5 8.5L12 2Z"
        fill="#D4AF37"
        opacity="0.9"
      />
      {/* Dynamic Upward arrow intersecting and integrated into the star */}
      <path
        d="M7 16L12 11L17 16"
        stroke="#1E3A8A"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 20V11.5"
        stroke="#1E3A8A"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Star center core */}
      <circle cx="12" cy="11" r="1.5" fill="#2563EB" />
    </svg>
  );
};

export default BrandLogo;
