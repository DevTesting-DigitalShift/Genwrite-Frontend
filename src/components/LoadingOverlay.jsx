// src/components/LoadingOverlay.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import Loading from './Loading';

const LoadingOverlay = () => {
  const loading = useSelector((state) => state.blog.loading);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center">
      <Loading 
        message={
          <div className="text-center">
            <p className="text-xl mb-2">Generating your blog content...</p>
            <p className="text-sm text-gray-500"> Writing  Compiling Blog .</p>
          </div>
        }
        size="large"
      />
    </div>
  );
};

export default LoadingOverlay;