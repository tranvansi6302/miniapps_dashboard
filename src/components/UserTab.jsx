import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Card, Badge, Tooltip, message, Popconfirm, Checkbox, Row, Col, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, UserOutlined, MailOutlined, IdcardOutlined, LockOutlined, ReloadOutlined } from '@ant-design/icons';
import { api } from '../services/api';

const { Text } = Typography;

export default function UserTab({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userPerms, setUserPerms] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const userPerm = currentUser?.username === 'admin' ? 7 : (currentUser?.menu_permissions?.['users'] || 0);
  const canEdit = (userPerm & 4) === 4;
  const canDelete = (userPerm & 2) === 2;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.get('/users');
      setUsers(data.data || data);
    } catch (err) {
      message.error('Không thể lấy danh sách người dùng: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenus = async () => {
    try {
      const res = await api.get('/menus');
      setMenus(res.data || []);
    } catch (err) {
      console.error('Không thể lấy danh sách menu để phân quyền:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchMenus();
  }, []);

  const handleEditClick = (user) => {
    if (!currentUser) {
      message.warning('Bạn cần đăng nhập để thực hiện chức năng này!');
      return;
    }
    if (!canEdit) {
      message.error('Bạn không có quyền chỉnh sửa thông tin thành viên!');
      return;
    }
    setEditingUser(user);
    setUserPerms(user.menu_permissions || {});
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
    if (!canDelete) {
      message.error('Bạn không có quyền vô hiệu hóa thành viên!');
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

  const handlePermChange = (menuKey, actionType, checked) => {
    setUserPerms(prev => {
      const updated = { ...prev };
      if (actionType === 'view') {
        if (checked) {
          updated[menuKey] = 0; // default View only
        } else {
          delete updated[menuKey]; // remove menu access entirely
        }
      } else {
        let bitVal = 0;
        if (actionType === 'add') bitVal = 1;
        if (actionType === 'delete') bitVal = 2;
        if (actionType === 'edit') bitVal = 4;

        let currentVal = updated[menuKey] || 0;
        if (checked) {
          currentVal |= bitVal;
        } else {
          currentVal &= ~bitVal;
        }
        updated[menuKey] = currentVal;
      }
      return updated;
    });
  };

  const handleModalSubmit = async (values) => {
    setSubmitting(true);
    try {
      const updatePayload = {
        email: values.email,
        fullName: values.fullName,
        full_name: values.fullName,
        menu_permissions: userPerms
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
      title: 'Quyền hạn Menu',
      dataIndex: 'menu_permissions',
      key: 'menu_permissions',
      render: (perms, record) => {
        if (record.username === 'admin') {
          return <Badge count="Full Quyền" style={{ backgroundColor: '#10b981' }} />;
        }
        const keys = Object.keys(perms || {});
        if (keys.length === 0) {
          return <span style={{ color: '#64748b', fontSize: '12px' }}>Không có quyền</span>;
        }
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {keys.map(k => {
              const val = perms[k] || 0;
              const actions = [];
              if ((val & 1) === 1) actions.push('+');
              if ((val & 4) === 4) actions.push('✎');
              if ((val & 2) === 2) actions.push('✗');
              const actStr = actions.length > 0 ? ` (${actions.join('')})` : ' (Xem)';
              return (
                <Badge 
                  key={k} 
                  count={`${k}${actStr}`} 
                  style={{ backgroundColor: '#4f46e5', fontSize: '10px', height: '18px', lineHeight: '18px', borderRadius: '4px' }} 
                />
              );
            })}
          </div>
        );
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 150,
      render: (_, record) => {
        const active = record.is_actived !== false && record.isActived !== false && record.is_actived !== 'false';
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
      width: 150,
      render: (_, record) => {
        const isActive = record.is_actived !== false && record.isActived !== false && record.is_actived !== 'false';
        const isEditingSelf = record.username === currentUser.username;
        return (
          <Space size="middle">
            <Tooltip title={canEdit ? "Chỉnh sửa tài khoản" : "Bạn không có quyền chỉnh sửa"}>
              <Button
                type="text"
                disabled={!canEdit}
                icon={<EditOutlined style={{ color: canEdit ? '#6366f1' : '#64748b' }} />}
                onClick={() => handleEditClick(record)}
              />
            </Tooltip>
            {isActive && !isEditingSelf && record.username !== 'admin' && (
              <Tooltip title={canDelete ? "Khóa tài khoản" : "Bạn không có quyền khóa"}>
                <Popconfirm
                  title="Xác nhận vô hiệu hóa người dùng?"
                  description="Người dùng này sẽ bị chuyển trạng thái không hoạt động."
                  onConfirm={() => handleDeactivate(record.id)}
                  okText="Đồng ý"
                  cancelText="Hủy"
                  disabled={!canDelete}
                >
                  <Button
                    type="text"
                    danger
                    disabled={!canDelete}
                    icon={<DeleteOutlined style={{ color: canDelete ? '#ef4444' : '#64748b' }} />}
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
    <div>
      <Card
        title={<span style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Quản lý Danh sách Người dùng & Phân Quyền</span>}
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
        title={<span style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>Chỉnh sửa thông tin & Phân quyền thành viên</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
        style={{ top: 80 }}
        bodyStyle={{ padding: '20px 0' }}
        wrapClassName="dark-modal"
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleModalSubmit}
          requiredMark={false}
        >
          <Row gutter={24}>
            {/* Left Column: User details */}
            <Col xs={24} md={10}>
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
            </Col>

            {/* Right Column: Permission Matrix */}
            <Col xs={24} md={14}>
              {editingUser?.username === 'admin' ? (
                <div style={{
                  padding: '24px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px dashed #10b981',
                  borderRadius: '6px',
                  color: '#4ade80',
                  fontSize: '13px',
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxSizing: 'border-box'
                }}>
                  Tài khoản quản trị viên tối cao luôn sở hữu đầy đủ quyền truy cập toàn bộ hệ thống.
                </div>
              ) : (
                <Form.Item label={<span style={{ color: '#e2e8f0', fontWeight: 600 }}>Phân quyền truy cập Menu & Chức năng</span>}>
                  <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '6px', padding: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Row gutter={[16, 8]} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '8px', color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>
                      <Col span={8}>Tên Menu</Col>
                      <Col span={4} style={{ textAlign: 'center' }}>Xem</Col>
                      <Col span={4} style={{ textAlign: 'center' }}>Thêm</Col>
                      <Col span={4} style={{ textAlign: 'center' }}>Sửa</Col>
                      <Col span={4} style={{ textAlign: 'center' }}>Xóa</Col>
                    </Row>
                    {menus.map(menu => {
                      const isView = menu.key in userPerms;
                      const maskVal = userPerms[menu.key] || 0;
                      const isAdd = (maskVal & 1) === 1;
                      const isDel = (maskVal & 2) === 2;
                      const isEdit = (maskVal & 4) === 4;

                      return (
                        <Row key={menu.key} gutter={[16, 8]} style={{ padding: '6px 0', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <Col span={8} style={{ color: '#fff', fontSize: '13px' }}>
                            {menu.label}
                          </Col>
                          <Col span={4} style={{ textAlign: 'center' }}>
                            <Checkbox
                              checked={isView}
                              onChange={(e) => handlePermChange(menu.key, 'view', e.target.checked)}
                            />
                          </Col>
                          <Col span={4} style={{ textAlign: 'center' }}>
                            <Checkbox
                              disabled={!isView}
                              checked={isView && isAdd}
                              onChange={(e) => handlePermChange(menu.key, 'add', e.target.checked)}
                            />
                          </Col>
                          <Col span={4} style={{ textAlign: 'center' }}>
                            <Checkbox
                              disabled={!isView}
                              checked={isView && isEdit}
                              onChange={(e) => handlePermChange(menu.key, 'edit', e.target.checked)}
                            />
                          </Col>
                          <Col span={4} style={{ textAlign: 'center' }}>
                            <Checkbox
                              disabled={!isView}
                              checked={isView && isDel}
                              onChange={(e) => handlePermChange(menu.key, 'delete', e.target.checked)}
                            />
                          </Col>
                        </Row>
                      );
                    })}
                  </div>
                </Form.Item>
              )}
            </Col>
          </Row>

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
