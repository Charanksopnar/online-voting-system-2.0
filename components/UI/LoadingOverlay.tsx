import React from 'react';

export const LoadingOverlay = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center flex-col">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
    <p className="text-gray-600 font-medium animate-pulse">{message}</p>
  </div>
);