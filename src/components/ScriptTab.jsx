import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Card, Badge, Tooltip, Switch, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, CodeOutlined, FileTextOutlined, BranchesOutlined } from '@ant-design/icons';
import { api } from '../services/api';

export default function ScriptTab({ currentUser }) {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScript, setEditingScript] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchScripts = async () => {
    setLoading(true);
    try {
      const data = await api.get('/scripts');
      setScripts(data.data || data);
    } catch (err) {
      message.error('Không thể tải các SDK bridge scripts: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScripts();
  }, []);

  const handleCreateClick = () => {
    if (!currentUser) {
      message.warning('Bạn cần đăng nhập để tạo SDK Script mới!');
      return;
    }
    setEditingScript(null);
    form.resetFields();
    form.setFieldsValue({
      is_actived: true,
      content: `// Hướng dẫn Adapter Script:
// Nhận vào tham số và tương tác với Host Bridge
(function() {
  console.log("SDK Bridge initialized");
  window.MiniAppBridge = {
    call: function(action, params) {
       console.log("Call bridge action:", action, params);
       return Promise.resolve({ success: true });
    }
  };
})();`
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (script) => {
    if (!currentUser) {
      message.warning('Bạn cần đăng nhập để sửa đổi SDK Script!');
      return;
    }
    setEditingScript(script);
    form.setFieldsValue({
      type: script.type,
      version: script.version,
      description: script.description,
      content: script.content,
      is_actived: script.is_actived !== false && script.isActived !== false && script.is_actived !== 'false'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!currentUser) {
      message.warning('Bạn cần đăng nhập để xóa SDK Script!');
      return;
    }
    try {
      await api.delete(`/scripts/${id}`);
      message.success('Xóa SDK Script thành công!');
      fetchScripts();
    } catch (err) {
      message.error(err.message || 'Không thể xóa SDK Script.');
    }
  };

  const handleModalSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        type: values.type,
        version: values.version,
        description: values.description,
        content: values.content,
        is_actived: !!values.is_actived
      };

      if (editingScript) {
        await api.put(`/scripts/${editingScript.id}`, payload);
        message.success('Cập nhật SDK Script thành công!');
      } else {
        await api.post('/scripts', payload);
        message.success('Thêm SDK Script mới thành công!');
      }
      setIsModalOpen(false);
      fetchScripts();
    } catch (err) {
      message.error(err.message || 'Lưu SDK Script thất bại.');
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
      title: 'Loại SDK (Type)',
      dataIndex: 'type',
      key: 'type',
      render: (text) => (
        <span style={{ fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CodeOutlined style={{ color: '#10b981' }} />
          <code>{text}</code>
        </span>
      ),
    },
    {
      title: 'Mô tả SDK',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => <span style={{ color: '#94a3b8' }}>{text || '—'}</span>
    },
    {
      title: 'Phiên bản',
      dataIndex: 'version',
      key: 'version',
      width: 120,
      render: (v) => <code style={{ color: '#eab308' }}>v{v}</code>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_actived',
      key: 'is_actived',
      width: 150,
      render: (isActive) => {
        const active = isActive !== false && isActive !== 'false';
        return active ? (
          <Badge status="success" text={<span style={{ color: '#4ade80' }}>Đang kích hoạt</span>} />
        ) : (
          <Badge status="error" text={<span style={{ color: '#f87171' }}>Tạm tắt</span>} />
        );
      },
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 200,
      render: (_, record) => {
        const isActive = record.is_actived !== false && record.is_actived !== 'false';
        return (
          <Space size="middle">
            <Tooltip title={currentUser ? "Chỉnh sửa code" : "Yêu cầu đăng nhập"}>
              <Button
                type="text"
                icon={<EditOutlined style={{ color: currentUser ? '#6366f1' : '#64748b' }} />}
                onClick={() => handleEditClick(record)}
              />
            </Tooltip>
            {isActive && (
              <Tooltip title={currentUser ? "Khóa/Xóa SDK Script" : "Yêu cầu đăng nhập"}>
                <Popconfirm
                  title="Xác nhận xóa SDK script này?"
                  description="Các Mini App đang phụ thuộc vào script này có thể không hoạt động chính xác."
                  onConfirm={() => handleDelete(record.id)}
                  okText="Xóa"
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
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

            <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Quản lý SDK Bridge Adapter Scripts</span>
          </div>
        }
        extra={
          <Space>
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
              Thêm Bridge Script
            </Button>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={fetchScripts}
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
          dataSource={scripts.map(s => ({ ...s, key: s.id }))}
          loading={loading}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          locale={{ emptyText: <span style={{ color: '#94a3b8' }}>Không có script adapter nào.</span> }}
          style={{ background: 'transparent' }}
          className="custom-table"
          size="small"
        />
      </Card>

      <Modal
        title={
          <span style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>
            {editingScript ? 'Soạn thảo Bridge Script' : 'Tạo mới Bridge Script'}
          </span>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
        width={800}
        style={{ top: 40 }}
        bodyStyle={{ padding: '20px 0' }}
        wrapClassName="dark-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleModalSubmit}
          requiredMark={false}
        >
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="type"
              label={<span style={{ color: '#e2e8f0' }}>Loại SDK Bridge (Type Key)</span>}
              rules={[
                { required: true, message: 'Nhập loại SDK!' },
                { pattern: /^[a-z0-9-_.]+$/, message: 'Mã chỉ bao gồm chữ thường không dấu, số, dấu chấm, gạch ngang/dưới!' }
              ]}
              style={{ flex: 1 }}
            >
              <Input
                prefix={<CodeOutlined style={{ color: '#94a3b8' }} />}
                placeholder="Ví dụ: payment, tracking, notification"
                disabled={!!editingScript}
                style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </Form.Item>

            <Form.Item
              name="version"
              label={<span style={{ color: '#e2e8f0' }}>Phiên bản SDK</span>}
              rules={[{ required: true, message: 'Nhập phiên bản!' }]}
              style={{ width: '200px' }}
            >
              <Input
                prefix={<FileTextOutlined style={{ color: '#94a3b8' }} />}
                placeholder="Ví dụ: 1.2.0"
                style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label={<span style={{ color: '#e2e8f0' }}>Mô tả chức năng</span>}
          >
            <Input
              placeholder="Script này giúp Mini App gọi các cổng thanh toán của Host App"
              style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </Form.Item>

          <Form.Item
            name="content"
            label={<span style={{ color: '#e2e8f0' }}>Nội dung mã Adapter JavaScript (JS)</span>}
            rules={[{ required: true, message: 'Nhập mã nguồn JS!' }]}
          >
            <Input.TextArea
              rows={12}
              placeholder="// Write your JavaScript adapter code here..."
              style={{
                fontFamily: '"Fira Code", Consolas, Monaco, "Courier New", monospace',
                fontSize: '13px',
                background: '#090d16',
                color: '#4ade80',
                border: '1px solid rgba(255,255,255,0.1)',
                lineHeight: '1.6',
                borderRadius: '5px'
              }}
            />
          </Form.Item>

          <Form.Item
            name="is_actived"
            label={<span style={{ color: '#e2e8f0' }}>Kích hoạt Hoạt động</span>}
            valuePropName="checked"
          >
            <Switch />
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
                {editingScript ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
