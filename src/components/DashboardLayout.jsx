import React, { useState } from 'react';
import { Layout, Menu, Button, Space, Avatar, Badge, Tooltip, message, Spin, Popconfirm } from 'antd';
import { 
  AppstoreOutlined, 
  TagsOutlined, 
  TeamOutlined, 
  BranchesOutlined, 
  LogoutOutlined, 
  UserOutlined,
  ArrowLeftOutlined,
  CopyOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { clearAuthData } from '../services/api';

const { Header, Sider, Content } = Layout;

export default function DashboardLayout({ currentUser, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  // State to store the active workspace app details and active tab within workspace
  const [workspaceApp, setWorkspaceApp] = useState(null);
  const [workspaceTab, setWorkspaceTab] = useState('overview');

  const isWorkspaceRoute = /^\/mini-apps\/[^/]+\/manage$/.test(location.pathname);

  const menuItems = [
    {
      key: 'mini-apps',
      icon: <AppstoreOutlined />,
      label: 'Ứng dụng Mini App',
    },
    {
      key: 'categories',
      icon: <TagsOutlined />,
      label: 'Danh mục Mini App',
    },
    {
      key: 'users',
      icon: <TeamOutlined />,
      label: 'Quản lý Người dùng',
    },
    {
      key: 'scripts',
      icon: <BranchesOutlined />,
      label: 'SDK Bridge Scripts',
    },
  ];

  const handleLogout = () => {
    clearAuthData();
    onLogout();
  };

  // Find active key from current path
  const getActiveKey = () => {
    const path = location.pathname;
    if (path.startsWith('/mini-apps')) return 'mini-apps';
    if (path.startsWith('/categories')) return 'categories';
    if (path.startsWith('/users')) return 'users';
    if (path.startsWith('/scripts')) return 'scripts';
    return 'mini-apps';
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#090d16', fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar Sider */}
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        style={{
          background: 'rgba(30, 41, 59, 0.45)',
          backdropFilter: 'blur(10px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          zIndex: 10,
        }}
        width={250}
      >
        {isWorkspaceRoute ? (
          // Mini App Dedicated Workspace Sidebar
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Back to main list button */}
            <div style={{
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            }}>
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => {
                  setWorkspaceApp(null);
                  navigate('/mini-apps');
                }}
                style={{
                  color: '#a5b4fc',
                  padding: 0,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  height: 'auto',
                }}
              >
                Quay lại danh sách
              </Button>
            </div>

            {!workspaceApp ? (
              // Workspace Loading/Skeleton State
              <div style={{
                padding: '24px',
                textAlign: 'center',
                color: '#94a3b8',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Spin size="default" style={{ color: '#6366f1' }} />
                <span style={{ fontSize: '11px', color: '#64748b' }}>Đang tải không gian...</span>
              </div>
            ) : (
              // Workspace Loaded State
              <>
                {/* Profile Block */}
                <div style={{
                  padding: '16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  color: '#fff'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    {workspaceApp.icon_url || workspaceApp.logoUrl ? (
                      <img
                        src={workspaceApp.icon_url || workspaceApp.logoUrl}
                        alt={workspaceApp.name}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '5px',
                          objectFit: 'contain',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.08)'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '5px',
                        background: '#6366f1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '15px'
                      }}>
                        {workspaceApp.name ? workspaceApp.name[0].toUpperCase() : 'A'}
                      </div>
                    )}
                    <div style={{ overflow: 'hidden' }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#f8fafc',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {workspaceApp.name}
                      </h3>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Phiên bản: v{workspaceApp.version || '1.0.0'}
                      </span>
                    </div>
                  </div>

                  {/* App ID Copy Section */}
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.4)',
                    borderRadius: '5px',
                    padding: '6px 10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <code style={{
                      fontSize: '11px',
                      color: '#cbd5e1',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '160px',
                      fontFamily: 'monospace'
                    }}>
                      {workspaceApp.app_id || workspaceApp.appId}
                    </code>
                    <Tooltip title="Sao chép App ID">
                      <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined style={{ fontSize: '12px', color: '#a5b4fc' }} />}
                        onClick={() => {
                          navigator.clipboard.writeText(workspaceApp.app_id || workspaceApp.appId);
                          message.success('Đã sao chép App ID!');
                        }}
                        style={{
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0
                        }}
                      />
                    </Tooltip>
                  </div>

                  {/* Status & Category Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Trạng thái:</span>
                      {(workspaceApp.is_actived !== false && workspaceApp.isActived !== false) ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80', fontWeight: 500 }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }}></span>
                          Phát hành
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontWeight: 500 }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f87171', display: 'inline-block' }}></span>
                          Tạm khóa
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Danh mục:</span>
                      <span style={{ color: '#cbd5e1', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }} title={workspaceApp.category_name}>
                        {workspaceApp.category_name || 'Chưa rõ'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Workspace Workspace Menu Options */}
                <Menu
                  theme="dark"
                  mode="inline"
                  selectedKeys={[workspaceTab]}
                  onClick={({ key }) => setWorkspaceTab(key)}
                  style={{ background: 'transparent', marginTop: '16px' }}
                  items={[
                    {
                      key: 'overview',
                      icon: <AppstoreOutlined style={{ fontSize: '14px' }} />,
                      label: 'Tổng quan',
                    },
                    {
                      key: 'members',
                      icon: <TeamOutlined style={{ fontSize: '14px' }} />,
                      label: 'Thành viên',
                    }
                  ].map(item => ({
                    ...item,
                    style: {
                      borderRadius: '5px',
                      margin: '4px 12px',
                      width: 'calc(100% - 24px)',
                    }
                  }))}
                />
              </>
            )}
          </div>
        ) : (
          // Main Dashboard Sidebar
          <>
            <div style={{
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              padding: '0 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            }}>
              <h2 style={{
                color: '#fff',
                fontSize: '15px',
                fontWeight: 700,
                margin: 0,
                background: 'linear-gradient(to right, #6366f1, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.5px'
              }}>
                MiniApp Admin
              </h2>
            </div>

            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[getActiveKey()]}
              onClick={({ key }) => navigate(`/${key}`)}
              style={{ background: 'transparent', marginTop: '16px' }}
              items={menuItems.map(item => ({
                ...item,
                style: {
                  borderRadius: '5px',
                  margin: '4px 12px',
                  width: 'calc(100% - 24px)',
                }
              }))}
              className="custom-menu"
            />
          </>
        )}
      </Sider>

      {/* Main Layout */}
      <Layout style={{ marginLeft: 250, background: 'transparent', minHeight: '100vh' }}>
        {/* Header */}
        <Header style={{
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '0 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '64px',
          position: 'sticky',
          top: 0,
          zIndex: 9
        }}>
          <div>
            <Badge status="success" text={
              <span style={{ color: '#4ade80', fontSize: '13px', fontWeight: 500 }}>
                Đã kết nối: Quản trị viên
              </span>
            } />
          </div>

          <Space size="large">
            <Space size="middle">
              <Avatar 
                icon={<UserOutlined />} 
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', verticalAlign: 'middle' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: '13px' }}>
                  {currentUser?.full_name || currentUser?.fullName || currentUser?.username}
                </span>
                <span style={{ color: '#64748b', fontSize: '11px' }}>
                  @{currentUser?.username}
                </span>
              </div>
              <Tooltip title="Đăng xuất" placement="bottom">
                <Popconfirm
                  title="Đăng xuất tài khoản"
                  description="Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?"
                  onConfirm={handleLogout}
                  okText="Đăng xuất"
                  cancelText="Hủy"
                  placement="bottomRight"
                  okButtonProps={{ danger: true, style: { borderRadius: '5px' } }}
                  cancelButtonProps={{ style: { borderRadius: '5px' } }}
                >
                  <Button 
                    type="text" 
                    icon={<LogoutOutlined style={{ color: '#f87171' }} />} 
                    style={{ marginLeft: '12px' }}
                  />
                </Popconfirm>
              </Tooltip>
            </Space>
          </Space>
        </Header>

        {/* Content Area */}
        <Content style={{ padding: '16px', overflow: 'initial' }}>
          <Outlet context={{ workspaceApp, setWorkspaceApp, workspaceTab, setWorkspaceTab }} />
        </Content>
      </Layout>
    </Layout>
  );
}

