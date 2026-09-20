import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme, message } from 'antd';
import { getAuthData } from './services/api';
import AuthPage from './components/AuthPage';
import DashboardLayout from './components/DashboardLayout';
import MiniAppTab from './components/MiniAppTab';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { user } = getAuthData();
    if (user) {
      setCurrentUser(user);
    }
    setLoading(false);

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
    return null;
  }

  const antTheme = {
    algorithm: theme.darkAlgorithm,
    token: {
      colorPrimary: '#6366f1',
      borderRadius: 8,
      borderRadiusLG: 8,
      borderRadiusSM: 6,
      borderRadiusXS: 4,
      fontSize: 13,
      fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      colorBgBase: '#090d16',
      colorBgContainer: '#1e293b',
      controlHeight: 36,
      controlHeightLG: 40,
      controlHeightSM: 32,
    },
    components: {
      Button: {
        borderRadius: 8,
        borderRadiusLG: 8,
        borderRadiusSM: 6,
        controlHeight: 36,
        controlHeightLG: 40,
        controlHeightSM: 32,
        paddingContentHorizontal: 16,
      },
      Input: {
        borderRadius: 8,
        controlHeight: 38,
      },
      Table: {
        colorBgContainer: 'rgba(30, 41, 59, 0.4)',
        colorHeaderBg: 'rgba(15, 23, 42, 0.6)',
        colorHeaderColor: '#94a3b8',
        colorRowHover: 'rgba(255, 255, 255, 0.03)',
        borderColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
      },
      Card: {
        borderRadiusLG: 8,
      },
      Modal: {
        colorBgElevated: '#1e293b',
        borderRadiusLG: 8,
      },
      Drawer: {
        colorBgElevated: '#0f172a',
        borderRadiusLG: 8,
      },
      Tag: {
        borderRadiusSM: 6,
      }
    }
  };

  return (
    <ConfigProvider theme={antTheme}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              !currentUser ? (
                <AuthPage onLoginSuccess={handleLoginSuccess} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

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
            <Route index element={<MiniAppTab currentUser={currentUser} />} />
            <Route path="mini-apps" element={<MiniAppTab currentUser={currentUser} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
