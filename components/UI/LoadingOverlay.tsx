import React from 'react';

export const LoadingOverlay = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-[60] flex items-center justify-center flex-col">
    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mb-4"></div>
    <p className="text-gray-800 font-semibold text-lg animate-pulse">{message}</p>
  </div>
);