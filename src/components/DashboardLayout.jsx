import React from 'react';
import { Layout, Button, Space, Avatar, Tag, Dropdown } from 'antd';
import {
  RocketOutlined,
  LogoutOutlined,
  UserOutlined,
  DownOutlined
} from '@ant-design/icons';
import { Outlet } from 'react-router-dom';
import { clearAuthData } from '../services/api';

const { Header, Content } = Layout;

export default function DashboardLayout({ currentUser, onLogout }) {
  const handleLogout = () => {
    clearAuthData();
    onLogout();
  };

  const userMenuItems = [
    {
      key: 'user-info',
      disabled: true,
      label: (
        <div style={{ padding: '6px 2px', lineHeight: 1.4 }}>
          <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: 13 }}>
            {currentUser?.full_name || currentUser?.username}
          </div>
          <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>
            @{currentUser?.username} ({currentUser?.role || 'admin'})
          </div>
        </div>
      )
    },
    {
      type: 'divider',
      style: { borderColor: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }
    },
    {
      key: 'logout',
      danger: true,
      icon: <LogoutOutlined style={{ fontSize: 13 }} />,
      label: <span style={{ fontWeight: 600, fontSize: 13 }}>Đăng xuất</span>,
      onClick: handleLogout
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#090d16', fontFamily: 'Inter, sans-serif' }}>
      {/* Sleek Top Header (Height: 48px) */}
      <Header style={{
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '0 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '48px',
        lineHeight: '48px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: 7,
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.35)'
          }}>
            <RocketOutlined style={{ fontSize: '15px', color: '#fff' }} />
          </div>
          <span style={{
            color: '#fff',
            fontSize: '15px',
            fontWeight: 700,
            letterSpacing: '-0.3px'
          }}>
            MiniApp Dev
          </span>
          <Tag color="purple" style={{ margin: 0, fontSize: '12px', fontWeight: 600, borderRadius: 4, lineHeight: '20px', padding: '0 8px' }}>
            PORTAL
          </Tag>
        </div>

        {/* User Profile with Dropdown Logout */}
        <Dropdown
          menu={{ items: userMenuItems }}
          trigger={['click']}
          placement="bottomRight"
          overlayStyle={{ minWidth: 190 }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            height: '32px',
            userSelect: 'none'
          }}
          className="user-profile-btn"
          >
            <Avatar
              size={22}
              icon={<UserOutlined style={{ fontSize: '12px' }} />}
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', borderRadius: 4 }}
            />
            <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: '13px' }}>
              {currentUser?.full_name || currentUser?.username}
            </span>
            <DownOutlined style={{ color: '#94a3b8', fontSize: '12px', marginLeft: 2 }} />
          </div>
        </Dropdown>
      </Header>

      {/* Main Content */}
      <Content style={{ padding: '16px 20px', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
        <Outlet />
      </Content>
    </Layout>
  );
}
