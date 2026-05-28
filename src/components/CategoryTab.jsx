import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Card, Badge, Tooltip, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, TagsOutlined, CodeOutlined, LinkOutlined } from '@ant-design/icons';
import { api } from '../services/api';

export default function CategoryTab({ currentUser }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const categoryPerm = currentUser?.username === 'admin' ? 7 : (currentUser?.menu_permissions?.['categories'] || 0);
  const canAdd = (categoryPerm & 1) === 1;
  const canDelete = (categoryPerm & 2) === 2;
  const canEdit = (categoryPerm & 4) === 4;

  const fetchCategories = async () => {
    setLoading(true);
    try {
      // If user is logged in, they can read all active or all admin categories. Let's hit the public GET /categories
      const data = await api.get('/categories');
      setCategories(data.data || data);
    } catch (err) {
      message.error('Không thể tải danh sách danh mục: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateClick = () => {
    if (!currentUser) {
      message.warning('Bạn cần đăng nhập để thêm danh mục mới!');
      return;
    }
    setEditingCategory(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditClick = (category) => {
    if (!currentUser) {
      message.warning('Bạn cần đăng nhập để chỉnh sửa danh mục!');
      return;
    }
    setEditingCategory(category);
    form.setFieldsValue({
      name: category.name,
      code: category.code,
      iconUrl: category.icon_url || category.iconUrl,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!currentUser) {
      message.warning('Bạn cần đăng nhập để xóa danh mục!');
      return;
    }
    try {
      await api.delete(`/categories/${id}`);
      message.success('Xóa danh mục thành công!');
      fetchCategories();
    } catch (err) {
      message.error(err.message || 'Không thể xóa danh mục.');
    }
  };

  const handleModalSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        name: values.name,
        code: values.code,
        icon_url: values.iconUrl,
      };

      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, payload);
        message.success('Cập nhật danh mục thành công!');
      } else {
        await api.post('/categories', payload);
        message.success('Thêm danh mục mới thành công!');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      message.error(err.message || 'Lưu danh mục thất bại.');
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
      title: 'Tên Danh Mục',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <span style={{ fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {record.icon_url || record.iconUrl ? (
            <img src={record.icon_url || record.iconUrl} alt={text} style={{ width: '20px', height: '20px', borderRadius: '5px', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
          ) : null}
          {text}
        </span>
      ),
    },
    {
      title: 'Mã Định Danh (Code)',
      dataIndex: 'code',
      key: 'code',
      render: (text) => <code style={{ color: '#ec4899', background: 'rgba(236,72,153,0.1)', padding: '2px 6px', borderRadius: '5px' }}>{text}</code>,
    },
    {
      title: 'Đường dẫn Icon',
      dataIndex: 'icon_url',
      key: 'icon_url',
      ellipsis: true,
      render: (text, record) => <span style={{ color: '#94a3b8' }}>{text || record.iconUrl || '—'}</span>,
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
          <Badge status="error" text={<span style={{ color: '#f87171' }}>Bị ẩn</span>} />
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
            <Tooltip title={canEdit ? "Chỉnh sửa danh mục" : "Bạn không có quyền chỉnh sửa"}>
              <Button
                type="text"
                disabled={!canEdit}
                icon={<EditOutlined style={{ color: canEdit ? '#6366f1' : '#64748b' }} />}
                onClick={() => handleEditClick(record)}
              />
            </Tooltip>
            {isActive && (
              <Tooltip title={canDelete ? "Xóa danh mục" : "Bạn không có quyền xóa"}>
                <Popconfirm
                  title="Xác nhận xóa danh mục?"
                  description="Danh mục này sẽ bị ẩn khỏi hệ thống Mini Apps công khai."
                  onConfirm={() => handleDelete(record.id)}
                  okText="Xóa"
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
    <div >
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

            <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Quản lý Danh mục Mini App</span>
          </div>
        }
        extra={
          <Space>
            {canAdd && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateClick}
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  border: 'none',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                }}
              >
                Thêm Danh mục
              </Button>
            )}
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={fetchCategories}
              loading={loading}
              style={{ background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)', color: '#a5b4fc' }}
            >
              Làm mới
            </Button>
          </Space>
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
          dataSource={categories.map(c => ({ ...c, key: c.id }))}
          loading={loading}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          locale={{ emptyText: <span style={{ color: '#94a3b8' }}>Không có danh mục nào.</span> }}
          style={{ background: 'transparent' }}
          className="custom-table"
          size="small"
        />
      </Card>

      <Modal
        title={
          <span style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>
            {editingCategory ? 'Chỉnh sửa Danh mục' : 'Thêm Danh mục mới'}
          </span>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
        style={{ top: 100 }}
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
            name="name"
            label={<span style={{ color: '#e2e8f0' }}>Tên Danh Mục</span>}
            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục!' }]}
          >
            <Input
              prefix={<TagsOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Ví dụ: Đặt chỗ, Mua sắm, Du lịch"
              style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </Form.Item>

          <Form.Item
            name="code"
            label={<span style={{ color: '#e2e8f0' }}>Mã Danh Mục (Duy nhất)</span>}
            rules={[
              { required: true, message: 'Vui lòng nhập mã danh mục!' },
              { pattern: /^[a-z0-9-_]+$/, message: 'Mã chỉ bao gồm chữ thường không dấu, số, gạch ngang, gạch dưới!' }
            ]}
          >
            <Input
              prefix={<CodeOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Ví dụ: booking, shopping, utilities"
              disabled={!!editingCategory}
              style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </Form.Item>

          <Form.Item
            name="iconUrl"
            label={<span style={{ color: '#e2e8f0' }}>Đường dẫn Icon (URL)</span>}
            rules={[{ required: true, message: 'Vui lòng nhập đường dẫn Icon cho danh mục!' }]}
          >
            <Input
              prefix={<LinkOutlined style={{ color: '#94a3b8' }} />}
              placeholder="https://example.com/icon.png"
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
                {editingCategory ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
