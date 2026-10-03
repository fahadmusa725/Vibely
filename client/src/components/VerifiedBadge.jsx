import React from 'react';

const VerifiedBadge = ({ size = 14, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`verified-badge-icon ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      title="Verified account"
    >
      <circle cx="12" cy="12" r="10" fill="#0095F6" />
      <path
        d="M8.5 12.5L10.8 14.8L15.5 9.5"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default VerifiedBadge;
