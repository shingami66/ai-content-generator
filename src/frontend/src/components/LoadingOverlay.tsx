// src/components/LoadingOverlay.tsx
import React from 'react';


const LoadingOverlay: React.FC = () => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center">
    <div className="bg-[#1e1e28] p-8 rounded-2xl flex flex-col items-center gap-4 shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-200">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-white font-medium animate-pulse">Creating content...</p>
    </div>
  </div>
);

export default LoadingOverlay;
