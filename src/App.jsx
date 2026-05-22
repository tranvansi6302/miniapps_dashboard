import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme, message } from 'antd';
import { getAuthData } from './services/api';
import AuthPage from './components/AuthPage';
import DashboardLayout from './components/DashboardLayout';

import MiniAppTab from './components/MiniAppTab';
import CategoryTab from './components/CategoryTab';
import UserTab from './components/UserTab';
import ScriptTab from './components/ScriptTab';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth status on Mount
  useEffect(() => {
    const { user } = getAuthData();
    if (user) {
      setCurrentUser(user);
    }
    setLoading(false);

    // Interceptor failure event listener (triggered when refresh token expires)
    const handleAuthFailed = () => {
      setCurrentUser(null);
      message.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!');
    };

    window.addEventListener('auth-failed', handleAuthFailed);
    return () => {
      window.removeEventListener('auth-failed', handleAuthFailed);
    };
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    message.success('Đã đăng xuất khỏi hệ thống.');
  };

  if (loading) {
    return null; // Loader during initialization
  }

  const antTheme = {
    algorithm: theme.darkAlgorithm,
    token: {
      colorPrimary: '#6366f1', // Sleek violet/indigo primary
      borderRadius: 5,
      fontSize: 13,
      fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      colorBgBase: '#090d16',
      colorBgContainer: '#1e293b'
    },
    components: {
      Table: {
        colorBgContainer: 'rgba(30, 41, 59, 0.4)',
        colorHeaderBg: 'rgba(15, 23, 42, 0.6)',
        colorHeaderColor: '#94a3b8',
        colorRowHover: 'rgba(255, 255, 255, 0.03)',
        borderColor: 'rgba(255, 255, 255, 0.05)',
      },
      Modal: {
        colorBgElevated: '#1e293b',
      },
      Drawer: {
        colorBgElevated: '#0f172a',
      }
    }
  };

  return (
    <ConfigProvider theme={antTheme}>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route 
            path="/login" 
            element={
              !currentUser ? (
                <AuthPage onLoginSuccess={handleLoginSuccess} />
              ) : (
                <Navigate to="/mini-apps" replace />
              )
            } 
          />

          {/* Authenticated Dashboard Shell */}
          <Route 
            path="/" 
            element={
              currentUser ? (
                <DashboardLayout currentUser={currentUser} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          >
            {/* Direct sub-routes under the DashboardLayout */}
            <Route index element={<Navigate to="/mini-apps" replace />} />
            <Route path="mini-apps" element={<MiniAppTab currentUser={currentUser} />} />
            <Route path="mini-apps/new" element={<MiniAppTab currentUser={currentUser} forceFormView={true} />} />
            <Route path="mini-apps/:id/edit" element={<MiniAppTab currentUser={currentUser} forceFormView={true} />} />
            <Route path="mini-apps/:id/manage" element={<MiniAppTab currentUser={currentUser} isWorkspaceView={true} />} />
            <Route path="categories" element={<CategoryTab currentUser={currentUser} />} />
            <Route path="users" element={<UserTab currentUser={currentUser} />} />
            <Route path="scripts" element={<ScriptTab currentUser={currentUser} />} />
            <Route path="*" element={<Navigate to="/mini-apps" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

