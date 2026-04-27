// src/components/CustomCalendarIcon.jsx
import React from 'react';

const CustomCalendarIcon = ({
  size = 24,
  color = 'currentColor',
  value = '1', // ✅ allows custom date value
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 24 24"
    stroke={color}
    strokeWidth=".5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Calendar outer frame */}
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    {/* Top divider */}
    <line x1="3" y1="9" x2="21" y2="9" />
    {/* Calendar rings */}
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="16" y1="2" x2="16" y2="6" />
    {/* Number inside */}
    <text
      x="12"
      y="19"
      textAnchor="middle"
      fontSize="10"
      fill={color}
      fontFamily="poppins"
      fontWeight="1"
    >
      {value}
    </text>
  </svg>
);

export default CustomCalendarIcon;
