import React, { useState } from 'react';
import { Card, Form, Input, Button, Tabs, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, IdcardOutlined, AppstoreOutlined } from '@ant-design/icons';
import { api, setAuthData } from '../services/api';

export default function AuthPage({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  const onLogin = async (values) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', {
        username: values.username,
        password: values.password,
      });
      message.success('Đăng nhập thành công!');
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
        full_name: values.full_name,
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
      background: 'linear-gradient(135deg, #090d16 0%, #0f172a 50%, #1e1b4b 100%)',
      padding: '20px',
      fontFamily: 'Inter, sans-serif',
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(0,0,0,0) 70%)',
        top: '15%',
        left: '25%',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, rgba(0,0,0,0) 70%)',
        bottom: '15%',
        right: '20%',
        zIndex: 0
      }} />

      <Card
        bordered={false}
        style={{
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5)',
          borderRadius: 8,
          background: 'rgba(30, 41, 59, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 1
        }}
        bodyStyle={{ padding: '32px 28px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
            marginBottom: '12px'
          }}>
            <AppstoreOutlined style={{ fontSize: '24px', color: '#fff' }} />
          </div>

          <h1 style={{
            color: '#fff',
            fontSize: '22px',
            fontWeight: 700,
            margin: 0,
            letterSpacing: '-0.3px'
          }}>
            MiniApp Dev Portal
          </h1>
          <p style={{ color: '#94a3b8', marginTop: '4px', fontSize: '13px' }}>
            Hệ thống quản lý & phát hành MiniApp
          </p>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          tabBarStyle={{ marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          items={[
            {
              key: 'login',
              label: <span style={{ color: activeTab === 'login' ? '#6366f1' : '#94a3b8', fontSize: '14px', fontWeight: 600 }}>Đăng nhập</span>,
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
                      style={{ borderRadius: 8 }}
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
                      style={{ borderRadius: 8 }}
                    />
                  </Form.Item>

                  <Form.Item style={{ marginTop: '20px', marginBottom: 0 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      size="large"
                      loading={loading}
                      style={{
                        height: 40,
                        fontSize: 14,
                        fontWeight: 600,
                        borderRadius: 8
                      }}
                    >
                      Đăng nhập
                    </Button>
                  </Form.Item>
                </Form>
              )
            },
            {
              key: 'register',
              label: <span style={{ color: activeTab === 'register' ? '#6366f1' : '#94a3b8', fontSize: '14px', fontWeight: 600 }}>Đăng ký</span>,
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
                      style={{ borderRadius: 8 }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="full_name"
                    rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
                  >
                    <Input
                      prefix={<IdcardOutlined style={{ color: '#64748b' }} />}
                      placeholder="Họ và tên"
                      size="large"
                      style={{ borderRadius: 8 }}
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
                      style={{ borderRadius: 8 }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    rules={[
                      { required: true, message: 'Vui lòng nhập mật khẩu!' },
                      { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự!' }
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined style={{ color: '#64748b' }} />}
                      placeholder="Mật khẩu"
                      size="large"
                      style={{ borderRadius: 8 }}
                    />
                  </Form.Item>

                  <Form.Item style={{ marginTop: '20px', marginBottom: 0 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      size="large"
                      loading={loading}
                      style={{
                        height: 40,
                        fontSize: 14,
                        fontWeight: 600,
                        borderRadius: 8
                      }}
                    >
                      Đăng ký tài khoản
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
