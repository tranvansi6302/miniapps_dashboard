import React, { useState } from 'react';
import { Card, Form, Input, Button, Tabs, Segmented, Tag, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, IdcardOutlined, GlobalOutlined, CodeOutlined } from '@ant-design/icons';
import { api, setAuthData, PROJECTS, getSelectedProject, setSelectedProject } from '../services/api';

export default function AuthPage({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [currentProject, setCurrentProjectState] = useState(getSelectedProject());

  const handleProjectSwitch = (projectId) => {
    setSelectedProject(projectId);
    const updated = getSelectedProject();
    setCurrentProjectState(updated);
    message.info(`Đã chuyển sang môi trường dự án: ${updated.name}`);
  };

  const onLogin = async (values) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', {
        username: values.username,
        password: values.password,
      });
      message.success(`Đăng nhập thành công vào dự án ${currentProject.name}!`);
      const loginPayload = res.data;
      setAuthData(loginPayload.user, loginPayload.accessToken, loginPayload.refreshToken);
      onLoginSuccess(loginPayload.user);
    } catch (err) {
      message.error(err.message || 'Tên đăng nhập hoặc mật khẩu không chính xác!');
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values) => {
    setLoading(true);
    try {
      await api.post('/auth/register', {
        username: values.username,
        password: values.password,
        email: values.email,
        fullName: values.fullName,
      });
      message.success('Đăng ký thành công! Hãy đăng nhập bằng tài khoản mới.');
      setActiveTab('login');
    } catch (err) {
      message.error(err.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '20px',
      fontFamily: 'Inter, sans-serif',
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%)',
        top: '10%',
        left: '20%',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, rgba(0,0,0,0) 70%)',
        bottom: '10%',
        right: '15%',
        zIndex: 0
      }} />

      {/* Main Card Container */}
      <Card 
        bordered={false}
        style={{
          width: '100%',
          maxWidth: '460px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
          borderRadius: '12px',
          background: 'rgba(30, 41, 59, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: 1
        }}
        bodyStyle={{ padding: '36px 32px' }}
      >
        {/* Dynamic Project Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ marginBottom: '12px' }}>
            <img
              src={currentProject.logo}
              alt={currentProject.name}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '12px',
                objectFit: 'contain',
                boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.3s ease'
              }}
            />
          </div>

          <div style={{ marginBottom: '8px' }}>
            <Tag color="purple" style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px' }}>
              <CodeOutlined style={{ marginRight: '4px' }} /> Môi trường DEV - Phục vụ phát triển
            </Tag>
          </div>

          <h1 style={{ 
            color: '#fff', 
            fontSize: '26px', 
            fontWeight: 800, 
            margin: 0,
            letterSpacing: '-0.5px',
            background: 'linear-gradient(to right, #6366f1, #a855f7, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            MiniApp Portal
          </h1>
          <p style={{ color: '#94a3b8', marginTop: '6px', fontSize: '13px' }}>
            Hệ thống Quản trị Mini Apps & SDK Bridge (DEV)
          </p>
        </div>

        {/* Dynamic Project Environment Switcher */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '24px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <span style={{ color: '#cbd5e1', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <GlobalOutlined style={{ color: '#6366f1' }} /> Chọn Dự án Quản trị:
            </span>
            <Tag color="blue" style={{ margin: 0, fontSize: '11px', fontWeight: 600 }}>
              {currentProject.name} MiniApp
            </Tag>
          </div>

          <Segmented
            block
            value={currentProject.id}
            onChange={handleProjectSwitch}
            options={PROJECTS.map(p => ({
              label: (
                <div style={{ padding: '4px 0', fontSize: '13px', fontWeight: 600 }}>
                  {p.name}
                </div>
              ),
              value: p.id
            }))}
            style={{
              background: 'rgba(30, 41, 59, 0.9)',
              padding: '3px'
            }}
          />
        </div>

        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          centered
          indicatorSize={(origin) => origin - 16}
          tabBarStyle={{ marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          items={[
            {
              key: 'login',
              label: <span style={{ color: activeTab === 'login' ? '#6366f1' : '#94a3b8', fontSize: '15px', fontWeight: 600 }}>Đăng nhập</span>,
              children: (
                <Form
                  name="loginForm"
                  layout="vertical"
                  onFinish={onLogin}
                  requiredMark={false}
                >
                  <Form.Item
                    name="username"
                    rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
                  >
                    <Input 
                      prefix={<UserOutlined style={{ color: '#64748b' }} />}
                      placeholder="Tên đăng nhập" 
                      size="large"
                      className="auth-input"
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                  >
                    <Input.Password
                      prefix={<LockOutlined style={{ color: '#64748b' }} />}
                      placeholder="Mật khẩu"
                      size="large"
                      className="auth-input"
                    />
                  </Form.Item>

                  <Form.Item style={{ marginTop: '24px', marginBottom: 0 }}>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      block 
                      size="large"
                      loading={loading}
                      style={{
                        background: '#6366f1',
                        border: 'none',
                        height: '38px',
                        fontWeight: 600
                      }}
                    >
                      Đăng nhập {currentProject.name}
                    </Button>
                  </Form.Item>
                </Form>
              )
            },
            {
              key: 'register',
              label: <span style={{ color: activeTab === 'register' ? '#6366f1' : '#94a3b8', fontSize: '15px', fontWeight: 600 }}>Đăng ký</span>,
              children: (
                <Form
                  name="registerForm"
                  layout="vertical"
                  onFinish={onRegister}
                  requiredMark={false}
                >
                  <Form.Item
                    name="username"
                    rules={[
                      { required: true, message: 'Vui lòng nhập tên đăng nhập!' },
                      { min: 3, message: 'Tên đăng nhập tối thiểu 3 ký tự!' }
                    ]}
                  >
                    <Input 
                      prefix={<UserOutlined style={{ color: '#64748b' }} />}
                      placeholder="Tên đăng nhập" 
                      size="large"
                      className="auth-input"
                    />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    rules={[
                      { required: true, message: 'Vui lòng nhập email!' },
                      { type: 'email', message: 'Email không đúng định dạng!' }
                    ]}
                  >
                    <Input 
                      prefix={<MailOutlined style={{ color: '#64748b' }} />}
                      placeholder="Email" 
                      size="large"
                      className="auth-input"
                    />
                  </Form.Item>

                  <Form.Item
                    name="fullName"
                    rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                  >
                    <Input 
                      prefix={<IdcardOutlined style={{ color: '#64748b' }} />}
                      placeholder="Họ và tên" 
                      size="large"
                      className="auth-input"
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    rules={[
                      { required: true, message: 'Vui lòng nhập mật khẩu!' },
                      { min: 6, message: 'Mật khẩu phải chứa ít nhất 6 ký tự!' }
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined style={{ color: '#64748b' }} />}
                      placeholder="Mật khẩu"
                      size="large"
                      className="auth-input"
                    />
                  </Form.Item>

                  <Form.Item style={{ marginTop: '24px', marginBottom: 0 }}>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      block 
                      size="large"
                      loading={loading}
                      style={{
                        background: '#6366f1',
                        border: 'none',
                        height: '38px',
                        fontWeight: 600
                      }}
                    >
                      Đăng ký tài khoản {currentProject.name}
                    </Button>
                  </Form.Item>
                </Form>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
}
