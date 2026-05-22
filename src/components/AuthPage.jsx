import React, { useState } from 'react';
import { Card, Form, Input, Button, Tabs, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, IdcardOutlined } from '@ant-design/icons';
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
      message.error(err.message || 'Đăng nhập thất bại. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values) => {
    setLoading(true);
    try {
      const data = await api.post('/auth/register', {
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
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '20px',
      fontFamily: 'Inter, sans-serif'
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

      <Card 
        bordered={false}
        style={{
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
          borderRadius: '5px',
          background: 'rgba(30, 41, 59, 0.75)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: 1
        }}
        bodyStyle={{ padding: '40px 32px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ 
            color: '#fff', 
            fontSize: '28px', 
            fontWeight: 800, 
            margin: 0,
            letterSpacing: '-0.5px',
            background: 'linear-gradient(to right, #6366f1, #a855f7, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            MiniApp Portal
          </h1>
          <p style={{ color: '#94a3b8', marginTop: '8px', fontSize: '14px' }}>
            Hệ thống Quản trị Mini Apps & SDK Bridge
          </p>
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
                      prefix={<UserOutlined style={{ color: 'rgba(255,255,255,0.45)' }} />} 
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
                      prefix={<LockOutlined style={{ color: 'rgba(255,255,255,0.45)' }} />}
                      placeholder="Mật khẩu"
                      size="large"
                      className="auth-input"
                    />
                  </Form.Item>

                  <Form.Item style={{ marginTop: '30px' }}>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      block 
                      size="large"
                      loading={loading}
                      className="auth-btn"
                    >
                      Đăng nhập
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
                      prefix={<UserOutlined style={{ color: 'rgba(255,255,255,0.45)' }} />} 
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
                      prefix={<MailOutlined style={{ color: 'rgba(255,255,255,0.45)' }} />} 
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
                      prefix={<IdcardOutlined style={{ color: 'rgba(255,255,255,0.45)' }} />} 
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
                      prefix={<LockOutlined style={{ color: 'rgba(255,255,255,0.45)' }} />}
                      placeholder="Mật khẩu"
                      size="large"
                      className="auth-input"
                    />
                  </Form.Item>

                  <Form.Item style={{ marginTop: '30px' }}>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      block 
                      size="large"
                      loading={loading}
                      className="auth-btn"
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
