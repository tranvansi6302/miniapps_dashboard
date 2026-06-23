import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme, message } from 'antd';
import { getAuthData, clearAuthData } from './services/api';
import AuthPage from './components/AuthPage';
import DashboardLayout from './components/DashboardLayout';

import MiniAppTab from './components/MiniAppTab';
import CategoryTab from './components/CategoryTab';
import UserTab from './components/UserTab';
import ScriptTab from './components/ScriptTab';
import DashboardTab from './components/DashboardTab';
import AppMenuTab from './components/AppMenuTab';
import AccountMenuTab from './components/AccountMenuTab';
import ModerationLogTab from './components/ModerationLogTab';


function PermissionGuard({ currentUser, menuKey, children }) {
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.username === 'admin') {
    return children;
  }
  const hasAccess = currentUser.menu_permissions && (menuKey in currentUser.menu_permissions);
  if (!hasAccess) {
    const allowedMenus = Object.keys(currentUser.menu_permissions || {});
    if (allowedMenus.length > 0) {
      return <Navigate to={`/${allowedMenus[0]}`} replace />;
    }
    // Force clean up to prevent infinite redirect loops
    clearAuthData();
    setTimeout(() => {
      window.dispatchEvent(new Event('auth-failed'));
    }, 0);
    return <Navigate to="/login" replace />;
  }
  return children;
}

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
      colorBgContainer: '#1e293b',
      controlHeight: 36, // Beautifully sleek, medium-height inputs (36px) natively aligned
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
      },
      Form: {
        itemMarginBottom: 12, // Compact vertical margins globally
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
                (() => {
                  const allowedMenus = Object.keys(currentUser.menu_permissions || {});
                  if (allowedMenus.length > 0) {
                    return <Navigate to={`/${allowedMenus[0]}`} replace />;
                  }
                  // Force logout to break redirect loop
                  clearAuthData();
                  setTimeout(() => {
                    setCurrentUser(null);
                    message.error('Tài khoản của bạn chưa được phân quyền truy cập menu nào.');
                  }, 0);
                  return <AuthPage onLoginSuccess={handleLoginSuccess} />;
                })()
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
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardTab />} />
            <Route path="mini-apps" element={<PermissionGuard currentUser={currentUser} menuKey="mini-apps"><MiniAppTab currentUser={currentUser} /></PermissionGuard>} />
            <Route path="mini-apps/new" element={<PermissionGuard currentUser={currentUser} menuKey="mini-apps"><MiniAppTab currentUser={currentUser} forceFormView={true} /></PermissionGuard>} />
            <Route path="mini-apps/:id/edit" element={<PermissionGuard currentUser={currentUser} menuKey="mini-apps"><MiniAppTab currentUser={currentUser} forceFormView={true} /></PermissionGuard>} />
            <Route path="mini-apps/:id/manage" element={<PermissionGuard currentUser={currentUser} menuKey="mini-apps"><MiniAppTab currentUser={currentUser} isWorkspaceView={true} /></PermissionGuard>} />
            
            <Route path="categories" element={<PermissionGuard currentUser={currentUser} menuKey="categories"><CategoryTab currentUser={currentUser} /></PermissionGuard>} />
            <Route path="categories/:id/manage" element={<PermissionGuard currentUser={currentUser} menuKey="categories"><CategoryTab currentUser={currentUser} isWorkspaceView={true} /></PermissionGuard>} />
            
            <Route path="app-menus" element={<PermissionGuard currentUser={currentUser} menuKey="app-menus"><AppMenuTab currentUser={currentUser} /></PermissionGuard>} />
            <Route path="app-menus/new" element={<PermissionGuard currentUser={currentUser} menuKey="app-menus"><AppMenuTab currentUser={currentUser} forceFormView={true} /></PermissionGuard>} />
            <Route path="app-menus/:id/edit" element={<PermissionGuard currentUser={currentUser} menuKey="app-menus"><AppMenuTab currentUser={currentUser} forceFormView={true} /></PermissionGuard>} />

            <Route path="account-menus" element={<PermissionGuard currentUser={currentUser} menuKey="account-menus"><AccountMenuTab currentUser={currentUser} /></PermissionGuard>} />

            <Route path="moderation-logs" element={<PermissionGuard currentUser={currentUser} menuKey="mini-apps"><ModerationLogTab /></PermissionGuard>} />

            <Route path="users" element={<PermissionGuard currentUser={currentUser} menuKey="users"><UserTab currentUser={currentUser} /></PermissionGuard>} />
            
            <Route path="scripts" element={<PermissionGuard currentUser={currentUser} menuKey="scripts"><ScriptTab currentUser={currentUser} /></PermissionGuard>} />
            <Route path="scripts/new" element={<PermissionGuard currentUser={currentUser} menuKey="scripts"><ScriptTab currentUser={currentUser} forceFormView={true} /></PermissionGuard>} />
            <Route path="scripts/:id/edit" element={<PermissionGuard currentUser={currentUser} menuKey="scripts"><ScriptTab currentUser={currentUser} forceFormView={true} /></PermissionGuard>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

