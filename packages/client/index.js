import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';
import { AllProviders } from './contexts/Providers';

ReactDOM.render(
  <AllProviders>
    <App />
  </AllProviders>,
  document.getElementById('root')
);