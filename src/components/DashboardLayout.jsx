import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Space, Avatar, Badge, Tooltip, message, Spin, Modal, Form, Input, Tag } from 'antd';
import {
  AppstoreOutlined,
  TagsOutlined,
  TeamOutlined,
  BranchesOutlined,
  LogoutOutlined,
  UserOutlined,
  LockOutlined,
  ArrowLeftOutlined,
  CopyOutlined,
  DashboardOutlined,
  MenuOutlined,
  SafetyOutlined,
  GlobalOutlined,
  SwapOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { clearAuthData, setAuthData, api, PROJECTS, getSelectedProject, setSelectedProject } from '../services/api';

const { Header, Sider, Content } = Layout;

export default function DashboardLayout({ currentUser, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Active Project Environment State
  const [activeProject, setActiveProject] = useState(getSelectedProject());

  // Quick Switch Project Modal State
  const [switchModalOpen, setSwitchModalOpen] = useState(false);
  const [targetProject, setTargetProject] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [switchForm] = Form.useForm();

  // State to store the active workspace app details and active tab within workspace
  const [workspaceApp, setWorkspaceApp] = useState(null);
  const [workspaceTab, setWorkspaceTab] = useState('overview');

  const [menus, setMenus] = useState([]);
  const [loadingMenus, setLoadingMenus] = useState(true);

  const isWorkspaceRoute = /^\/(mini-apps|categories)\/[^/]+\/manage$/.test(location.pathname);

  // Fetch menus on mount or when project environment changes
  const fetchMenus = async () => {
    setLoadingMenus(true);
    try {
      const res = await api.get('/menus');
      setMenus(res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh mục menu:', err);
    } finally {
      setLoadingMenus(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleOpenSwitchModal = () => {
    const nextProject = PROJECTS.find(p => p.id !== activeProject.id) || PROJECTS[0];
    setTargetProject(nextProject);
    switchForm.setFieldsValue({ username: currentUser?.username || 'admin', password: '' });
    setSwitchModalOpen(true);
  };

  const onSwitchLogin = async (values) => {
    if (!targetProject) return;
    setModalLoading(true);

    try {
      const response = await fetch(`${targetProject.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: values.username, password: values.password })
      });

      const data = await response.json();

      if (!response.ok || !data.data) {
        throw new Error(data.message || 'Tên đăng nhập hoặc mật khẩu không chính xác!');
      }

      // Save new project ID and authentication payload
      localStorage.setItem('selectedProjectId', targetProject.id);
      setAuthData(data.data.user, data.data.accessToken, data.data.refreshToken);

      message.success(`Đã đăng nhập thành công vào dự án ${targetProject.name}!`);
      setSwitchModalOpen(false);

      // Automatically reload page to fetch fresh data for new project in place!
      window.location.reload();
    } catch (err) {
      message.error(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại mật khẩu!');
    } finally {
      setModalLoading(false);
    }
  };

  // Styled modern menu icons with custom colors
  const menuIcons = {
    'dashboard': <DashboardOutlined style={{ color: '#818cf8', fontSize: '14px' }} />,
    'mini-apps': <AppstoreOutlined style={{ color: '#38bdf8', fontSize: '14px' }} />,
    'categories': <TagsOutlined style={{ color: '#c084fc', fontSize: '14px' }} />,
    'users': <TeamOutlined style={{ color: '#fb7185', fontSize: '14px' }} />,
    'scripts': <BranchesOutlined style={{ color: '#facc15', fontSize: '14px' }} />,
    'app-menus': <MenuOutlined style={{ color: '#34d399', fontSize: '14px' }} />,
    'account-menus': <UserOutlined style={{ color: '#22d3ee', fontSize: '14px' }} />,
    'moderation-logs': <SafetyOutlined style={{ color: '#f472b6', fontSize: '14px' }} />,
  };

  const filteredMenuItems = menus
    .filter(menu => {
      if (menu.key === 'mini-apps') return false; // Hide Mini Apps menu
      if (currentUser.username === 'admin') return true;
      return currentUser.menu_permissions && (menu.key in currentUser.menu_permissions);
    })
    .map(menu => ({
      key: menu.key,
      icon: menuIcons[menu.key] || <AppstoreOutlined style={{ color: '#818cf8' }} />,
      label: menu.key === 'categories' ? 'Nhóm Mini App' : menu.label
    }))
    .sort((a, b) => {
      if (a.key === 'dashboard') return -1;
      if (b.key === 'dashboard') return 1;
      return 0;
    });

  const handleLogout = () => {
    clearAuthData();
    onLogout();
  };

  // Find active key from current path
  const getActiveKey = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'dashboard';
    if (path.startsWith('/mini-apps')) return 'mini-apps';
    if (path.startsWith('/categories')) return 'categories';
    if (path.startsWith('/users')) return 'users';
    if (path.startsWith('/scripts')) return 'scripts';
    if (path.startsWith('/app-menus')) return 'app-menus';
    if (path.startsWith('/account-menus')) return 'account-menus';
    if (path.startsWith('/moderation-logs')) return 'moderation-logs';
    return 'dashboard';
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#090d16', fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar Sider (Sleek width = 220px) */}
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        style={{
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(12px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          zIndex: 10,
        }}
        width={220}
      >
        {isWorkspaceRoute ? (
          // Mini App Dedicated Workspace Sidebar
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Back to main list button */}
             <div style={{
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              padding: '0 14px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
            }}>
              <Button
                type="text"
                icon={<ArrowLeftOutlined style={{ fontSize: '11px' }} />}
                onClick={() => {
                  setWorkspaceApp(null);
                  navigate('/categories');
                }}
                style={{
                  color: '#94a3b8',
                  padding: '2px 8px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  height: '28px',
                  borderRadius: '5px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
                className="back-btn-hover"
              >
                Quay lại danh sách
              </Button>
            </div>

            {!workspaceApp ? (
              // Workspace Loading/Skeleton State
              <div style={{
                padding: '20px',
                textAlign: 'center',
                color: '#94a3b8',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Spin size="small" style={{ color: '#6366f1' }} />
                <span style={{ fontSize: '11px', color: '#64748b' }}>Đang tải...</span>
              </div>
            ) : (
              // Workspace Loaded State
              <>
                {/* Profile Block */}
                <div style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  color: '#fff'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    {workspaceApp.icon_url || workspaceApp.logoUrl ? (
                      <img
                        src={workspaceApp.icon_url || workspaceApp.logoUrl}
                        alt={workspaceApp.name}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '5px',
                          objectFit: 'contain'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '5px',
                        background: '#6366f1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '13px'
                      }}>
                        {workspaceApp.name ? workspaceApp.name[0].toUpperCase() : 'A'}
                      </div>
                    )}
                    <div style={{ overflow: 'hidden' }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#f8fafc',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {workspaceApp.name}
                      </h3>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                        v{workspaceApp.version || '1.0.0'}
                      </span>
                    </div>
                  </div>

                  {/* App ID Copy Section */}
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.4)',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <code style={{
                      fontSize: '10px',
                      color: '#cbd5e1',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '130px',
                      fontFamily: 'monospace'
                    }}>
                      {workspaceApp.app_id || workspaceApp.appId}
                    </code>
                    <Tooltip title="Sao chép App ID">
                      <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined style={{ fontSize: '11px', color: '#a5b4fc' }} />}
                        onClick={() => {
                          navigator.clipboard.writeText(workspaceApp.app_id || workspaceApp.appId);
                          message.success('Đã sao chép App ID!');
                        }}
                        style={{
                          width: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0
                        }}
                      />
                    </Tooltip>
                  </div>
                </div>

                {/* Workspace Menu Options */}
                 <Menu
                  theme="dark"
                  mode="inline"
                  selectedKeys={[workspaceTab]}
                  onClick={({ key }) => setWorkspaceTab(key)}
                  style={{ background: 'transparent', marginTop: '10px' }}
                  className="custom-menu"
                  items={[
                    {
                      key: 'overview',
                      icon: <AppstoreOutlined style={{ fontSize: '13px', color: '#818cf8' }} />,
                      label: 'Tổng quan',
                    },
                    {
                      key: 'versions',
                      icon: <BranchesOutlined style={{ fontSize: '13px', color: '#facc15' }} />,
                      label: 'Phiên bản',
                    },
                    {
                      key: 'members',
                      icon: <TeamOutlined style={{ fontSize: '13px', color: '#fb7185' }} />,
                      label: 'Thành viên',
                    }
                  ].filter(item => {
                    const isChildApp = workspaceApp && 
                      (workspaceApp.app_id !== 'user.global.homebooking' && workspaceApp.app_id !== 'partner.global.homebooking') &&
                      (workspaceApp.app_id.startsWith('user.global.homebooking') || workspaceApp.app_id.startsWith('partner.global.homebooking'));
                    if (isChildApp && (item.key === 'versions' || item.key === 'members')) {
                      return false;
                    }
                    return true;
                  }).map(item => ({
                    ...item,
                    style: {
                      borderRadius: '5px',
                      margin: '2px 8px',
                      width: 'calc(100% - 16px)',
                      height: '34px',
                      lineHeight: '34px',
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
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '0 16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            }}>
              <img
                src={activeProject.logo}
                alt={activeProject.name}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '5px',
                  objectFit: 'contain'
                }}
              />
              <h2 style={{
                color: '#fff',
                fontSize: '14px',
                fontWeight: 700,
                margin: 0,
                letterSpacing: '-0.3px'
              }}>
                {activeProject.name} MA
              </h2>
            </div>

            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[getActiveKey()]}
              onClick={({ key }) => navigate(`/${key}`)}
              style={{ background: 'transparent', marginTop: '10px' }}
              items={filteredMenuItems.map(item => ({
                ...item,
                style: {
                  borderRadius: '5px',
                  margin: '2px 8px',
                  width: 'calc(100% - 16px)',
                  height: '34px',
                  lineHeight: '34px',
                  fontSize: '12px'
                }
              }))}
              className="custom-menu"
            />
          </>
        )}
      </Sider>

      {/* Main Layout (marginLeft aligned to 220px) */}
      <Layout style={{ marginLeft: 220, background: 'transparent', minHeight: '100vh' }}>
        {/* Compact Header (Height: 48px) */}
        <Header style={{
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '0 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '48px',
          lineHeight: '48px',
          position: 'sticky',
          top: 0,
          zIndex: 9
        }}>
          {/* Project Environment Switcher Button in Header */}
          <Space size="small">
            <Button
              type="text"
              size="small"
              onClick={handleOpenSwitchModal}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '5px',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '2px 8px',
                height: '28px'
              }}
            >
              <GlobalOutlined style={{ color: '#0058F1', fontSize: '13px' }} />
              <span style={{ fontWeight: 600, fontSize: '12px' }}>{activeProject.name}</span>
              <Tag color="blue" style={{ margin: 0, fontSize: '9px', padding: '0 4px', lineHeight: '16px' }}>
                ACTIVE
              </Tag>
              <SwapOutlined style={{ color: '#94a3b8', fontSize: '11px' }} />
            </Button>

            <Badge status="processing" text={
              <span style={{ color: '#a855f7', fontSize: '11px', fontWeight: 600 }}>
                DEV Environment
              </span>
            } />
          </Space>

          <Space size="middle">
            <Space size="small">
              <Avatar
                size={26}
                icon={<UserOutlined style={{ fontSize: '12px' }} />}
                style={{ background: 'linear-gradient(135deg, #0058F1 0%, #a855f7 100%)', verticalAlign: 'middle' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.1' }}>
                <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: '12px' }}>
                  {currentUser?.full_name || currentUser?.fullName || currentUser?.username}
                </span>
                <span style={{ color: '#64748b', fontSize: '10px' }}>
                  @{currentUser?.username}
                </span>
              </div>
              <Tooltip title="Đăng xuất" placement="bottom">
                <Button
                  type="text"
                  size="small"
                  icon={<LogoutOutlined style={{ color: '#f87171', fontSize: '13px' }} />}
                  onClick={handleLogout}
                  style={{ marginLeft: '4px', width: '26px', height: '26px', padding: 0 }}
                />
              </Tooltip>
            </Space>
          </Space>
        </Header>

        {/* Content Area */}
        <Content style={{ padding: '16px', overflow: 'initial' }}>
          <Outlet context={{ workspaceApp, setWorkspaceApp, workspaceTab, setWorkspaceTab }} />
        </Content>
      </Layout>

      {/* In-Place Quick Project Switch Login Modal */}
      <Modal
        open={switchModalOpen}
        onCancel={() => setSwitchModalOpen(false)}
        footer={null}
        width={380}
        wrapClassName="dark-modal"
        centered
      >
        {targetProject && (
          <div style={{ padding: '8px 4px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <img
                src={targetProject.logo}
                alt={targetProject.name}
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '10px',
                  objectFit: 'contain',
                  marginBottom: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}
              />
              <h3 style={{ color: '#fff', fontSize: '17px', fontWeight: 700, margin: '0 0 4px 0' }}>
                Chuyển sang {targetProject.name}
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
                Nhập tài khoản để kết nối ngay vào môi trường {targetProject.name}
              </p>
            </div>

            <Form
              form={switchForm}
              layout="vertical"
              onFinish={onSwitchLogin}
              requiredMark={false}
            >
              <Form.Item
                name="username"
                rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
                style={{ marginBottom: '14px' }}
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#64748b' }} />}
                  placeholder="Tên đăng nhập"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                style={{ marginBottom: '20px' }}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#64748b' }} />}
                  placeholder="Mật khẩu"
                  size="large"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={modalLoading}
                  className="submit-btn-38"
                  style={{
                    background: '#6366f1',
                    border: 'none',
                    fontWeight: 600,
                    height: '38px'
                  }}
                >
                  Xác nhận & Chuyển sang {targetProject.name}
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
