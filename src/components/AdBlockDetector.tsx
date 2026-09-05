import React from 'react';

export const AdBlockDetector: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Hard ad-blocker gate removed as per user request to improve SEO and retention.
  return <>{children}</>;
};
