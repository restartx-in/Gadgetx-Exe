import React from 'react';
import './style.scss';

const CommonSkeleton = () => (
  <div className="common_skeleton">
    <div className="common_skeleton-header">
      <div className="common_skeleton-title" />
      <div className="common_skeleton-subtitle" />
    </div>
    <div className="common_skeleton-card" />
  </div>
);

export default CommonSkeleton;
