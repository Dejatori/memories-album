import React from 'react';
import { useRoutes } from 'react-router-dom';
import { routes } from './router';

const App: React.FC = () => {
  // Use the routes configuration from router/index.tsx
  const routeElement = useRoutes(routes);

  return (
    <div className="app">
      {/* This will render the appropriate component based on the current route */}
      {routeElement}
    </div>
  );
};

export default App;
