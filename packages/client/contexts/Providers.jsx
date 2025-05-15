import React from 'react';
import { AppProvider } from './context';
import { AuthProvider } from './AuthProvider';

export const AllProviders = ({ children }) => {
  return (
    <AppProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </AppProvider>
  );
};