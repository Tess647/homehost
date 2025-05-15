// packages/client/components/LoadingSpinner.jsx
import React from 'react';

/**
 * LoadingSpinner component that displays a loading animation
 * Used when authentication status is being checked
 * 
 * @returns {React.ReactNode} Loading spinner component
 */
const LoadingSpinner = () => {
  return (
    <div className="loading-spinner-container" data-testid="loading-spinner">
      <div className="loading-spinner">
        <div className="spinner-circle"></div>
      </div>
      <p className="loading-text">Loading...</p>
      
      {/* CSS for the spinner - can be moved to a separate CSS file */}
      <style jsx>{`
        .loading-spinner-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          width: 100%;
        }
        
        .loading-spinner {
          display: inline-block;
          position: relative;
          width: 80px;
          height: 80px;
        }
        
        .spinner-circle {
          box-sizing: border-box;
          display: block;
          position: absolute;
          width: 64px;
          height: 64px;
          margin: 8px;
          border: 6px solid #3498db;
          border-radius: 50%;
          animation: loading-spinner 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
          border-color: #3498db transparent transparent transparent;
        }
        
        .loading-text {
          margin-top: 16px;
          font-size: 18px;
          color: #333;
        }
        
        @keyframes loading-spinner {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;