// src/App.tsx
import React, { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';

// Components
import Header from './components/Header';

import LoadingOverlay from './components/LoadingOverlay';

// Pages
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import GalleryPage from './pages/GalleryPage';
import SubscriptionPage from './pages/SubscriptionPage';
import FeedbackPage from './pages/FeedbackPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import AuthenticationPage from './pages/AuthenticationPage';
import './index.css';


// ============= LAYOUT WRAPPER ============= 
const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const location = useLocation();
  const hideHeaderFooter = location.pathname === '/login' || location.pathname === '/register';
  const isLandingPage = location.pathname === '/';

  return (
    <>
      {!hideHeaderFooter && <Header />}
      <main className={`flex-1 w-full ${isLandingPage ? '' : 'p-8 max-w-7xl mx-auto pt-24'}`}>
        {children}
      </main>
    </>
  );
};

// Component to handle the loading state from context
const AppLoadingOverlay: React.FC = () => {
  const { isGenerating } = useAppContext();
  return isGenerating ? <LoadingOverlay /> : null;
};

import { GoogleOAuthProvider } from '@react-oauth/google';

// ============= MAIN APP =============  
import { Toaster } from 'react-hot-toast';

function App() {
  const googleClientId = "920976122998-l46dbf6n9msg66c2l7s4mn0df7ja82q0.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Router>
        <AppProvider>
          <div className="min-h-screen flex flex-col bg-app-gradient text-white font-sans antialiased">
            <Toaster position="top-right" toastOptions={{
              style: {
                background: '#333',
                color: '#fff',
              },
            }} />
            <Routes>
              {/* Landing page with Layout for header/footer */}
              <Route path="/" element={<Layout><LandingPage /></Layout>} />

              {/* Other pages wrapped with Layout for Header/Footer */}
              <Route path="/dashboard" element={<Layout><DashboardPage /></Layout>} />
              <Route path="/gallery" element={<Layout><GalleryPage /></Layout>} />
              <Route path="/subscription" element={<Layout><SubscriptionPage /></Layout>} />
              <Route path="/settings" element={<Layout><SettingsPage /></Layout>} />
              <Route path="/feedback" element={<Layout><FeedbackPage /></Layout>} />
              <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />

              {/* Auth pages - integrated: now share the same component */}
              <Route path="/login" element={<AuthenticationPage />} />
              <Route path="/register" element={<AuthenticationPage />} />
            </Routes>
            <AppLoadingOverlay />
          </div>
        </AppProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}


export default App;