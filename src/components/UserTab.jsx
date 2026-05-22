import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Card, Badge, Tooltip, message, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, UserOutlined, MailOutlined, IdcardOutlined, LockOutlined, ReloadOutlined } from '@ant-design/icons';
import { api, getAuthData } from '../services/api';

export default function UserTab({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.get('/users');
      // Set users sorted by ID or created_at
      setUsers(data.data || data);
    } catch (err) {
      message.error('Không thể lấy danh sách người dùng: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditClick = (user) => {
    if (!currentUser) {
      message.warning('Bạn cần đăng nhập để thực hiện chức năng này!');
      return;
    }
    setEditingUser(user);
    form.setFieldsValue({
      email: user.email,
      fullName: user.full_name || user.fullName,
      password: '' // empty by default
    });
    setIsModalOpen(true);
  };

  const handleDeactivate = async (id) => {
    if (!currentUser) {
      message.warning('Bạn cần đăng nhập để thực hiện chức năng này!');
      return;
    }
    try {
      await api.delete(`/users/${id}`);
      message.success('Vô hiệu hóa người dùng thành công!');
      fetchUsers();
    } catch (err) {
      message.error(err.message || 'Không thể vô hiệu hóa người dùng.');
    }
  };

  const handleModalSubmit = async (values) => {
    setSubmitting(true);
    try {
      const updatePayload = {
        email: values.email,
        fullName: values.fullName,
      };
      if (values.password && values.password.trim()) {
        updatePayload.password = values.password.trim();
      }

      await api.put(`/users/${editingUser.id}`, updatePayload);
      message.success('Cập nhật tài khoản người dùng thành công!');
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      message.error(err.message || 'Cập nhật tài khoản thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Mã số (ID)',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Tên Đăng Nhập',
      dataIndex: 'username',
      key: 'username',
      fontWeight: 'bold',
      render: (text) => <span style={{ fontWeight: 600, color: '#f8fafc' }}>{text}</span>,
    },
    {
      title: 'Họ và Tên',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (text, record) => <span>{text || record.fullName || '—'}</span>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 150,
      render: (isActive) => {
        const active = isActive !== false && isActive !== 'false';
        return active ? (
          <Badge status="success" text={<span style={{ color: '#4ade80' }}>Đang hoạt động</span>} />
        ) : (
          <Badge status="error" text={<span style={{ color: '#f87171' }}>Bị khóa</span>} />
        );
      },
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 200,
      render: (_, record) => {
        const isActive = record.is_active !== false && record.is_active !== 'false';
        return (
          <Space size="middle">
            <Tooltip title={currentUser ? "Chỉnh sửa tài khoản" : "Yêu cầu đăng nhập để sửa"}>
              <Button
                type="text"
                icon={<EditOutlined style={{ color: currentUser ? '#6366f1' : '#64748b' }} />}
                onClick={() => handleEditClick(record)}
              />
            </Tooltip>
            {isActive && (
              <Tooltip title={currentUser ? "Khóa tài khoản" : "Yêu cầu đăng nhập để khóa"}>
                <Popconfirm
                  title="Xác nhận vô hiệu hóa người dùng?"
                  description="Người dùng này sẽ bị chuyển trạng thái không hoạt động."
                  onConfirm={() => handleDeactivate(record.id)}
                  okText="Đồng ý"
                  cancelText="Hủy"
                  disabled={!currentUser}
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined style={{ color: currentUser ? '#ef4444' : '#64748b' }} />}
                    disabled={!currentUser}
                  />
                </Popconfirm>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div >
      <Card
        title={<span style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Quản lý Danh sách Người dùng</span>}
        extra={
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={fetchUsers}
            loading={loading}
            style={{ background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)', color: '#a5b4fc' }}
          >
            Làm mới
          </Button>
        }
        bordered={false}
        style={{
          background: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '5px',
        }}
      >
        <Table
          columns={columns}
          dataSource={users.map(u => ({ ...u, key: u.id }))}
          loading={loading}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          locale={{ emptyText: <span style={{ color: '#94a3b8' }}>Không có người dùng nào.</span> }}
          style={{ background: 'transparent' }}
          className="custom-table"
          size="small"
        />
      </Card>

      <Modal
        title={<span style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>Chỉnh sửa thông tin thành viên</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
        style={{ top: 80 }}
        bodyStyle={{ padding: '20px 0' }}
        wrapClassName="dark-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleModalSubmit}
          requiredMark={false}
        >
          <Form.Item
            name="fullName"
            label={<span style={{ color: '#e2e8f0' }}>Họ và tên</span>}
            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
          >
            <Input
              prefix={<IdcardOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Nhập họ và tên đầy đủ"
              style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label={<span style={{ color: '#e2e8f0' }}>Địa chỉ Email</span>}
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#94a3b8' }} />}
              placeholder="example@mail.com"
              style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span style={{ color: '#e2e8f0' }}>Mật khẩu mới (Để trống nếu không đổi)</span>}
            rules={[{ min: 6, message: 'Mật khẩu tối thiểu phải 6 ký tự!' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Nhập mật khẩu mới nếu muốn thay đổi"
              style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: '24px', textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none' }}>
                Hủy bỏ
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none' }}
              >
                Cập nhật
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
