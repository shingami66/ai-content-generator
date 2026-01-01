// src/components/LoadingOverlay.tsx
import React from 'react';
import '../AI.css';

const LoadingOverlay: React.FC = () => (
  <div className="loading-overlay">
    <div className="loading-content">
      <div className="loading-spinner"></div>
      <p>Creating content...</p>
    </div>
  </div>
);

export default LoadingOverlay;
