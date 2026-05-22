import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Form, Input, Card, Badge, Tooltip, Switch, message, Popconfirm, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, CodeOutlined, FileTextOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { api } from '../services/api';
import { useNavigate, useParams } from 'react-router-dom';

export default function ScriptTab({ currentUser, forceFormView = false }) {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  // If we are in form view and have an id, it's edit mode
  const isEditing = forceFormView && !!id;

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

  const fetchScriptDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.get(`/scripts/${id}`);
      const script = data.data || data;
      form.setFieldsValue({
        type: script.type,
        version: script.version,
        description: script.description,
        content: script.content,
        is_actived: script.is_actived !== false && script.isActived !== false && script.is_actived !== 'false'
      });
    } catch (err) {
      message.error('Không thể tải thông tin SDK script: ' + err.message);
      navigate('/scripts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (forceFormView) {
      if (isEditing) {
        fetchScriptDetails();
      } else {
        form.resetFields();
        form.setFieldsValue({
          is_actived: true,
          content: `// Hướng dẫn Adapter Script:\n// Nhận vào tham số và tương tác với Host Bridge\n(function() {\n  console.log("SDK Bridge initialized");\n  window.MiniAppBridge = {\n    call: function(action, params) {\n       console.log("Call bridge action:", action, params);\n       return Promise.resolve({ success: true });\n    }\n  };\n})();`
        });
      }
    } else {
      fetchScripts();
    }
  }, [forceFormView, id]);

  const handleCreateClick = () => {
    if (!currentUser) {
      message.warning('Bạn cần đăng nhập để tạo SDK Script mới!');
      return;
    }
    navigate('/scripts/new');
  };

  const handleEditClick = (script) => {
    if (!currentUser) {
      message.warning('Bạn cần đăng nhập để sửa đổi SDK Script!');
      return;
    }
    navigate(`/scripts/${script.id}/edit`);
  };

  const handleDelete = async (idToDelete) => {
    if (!currentUser) {
      message.warning('Bạn cần đăng nhập để xóa SDK Script!');
      return;
    }
    try {
      await api.delete(`/scripts/${idToDelete}`);
      message.success('Xóa SDK Script thành công!');
      fetchScripts();
    } catch (err) {
      message.error(err.message || 'Không thể xóa SDK Script.');
    }
  };

  const handleFormSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        type: values.type,
        version: values.version,
        description: values.description,
        content: values.content,
        is_actived: !!values.is_actived
      };

      if (isEditing) {
        await api.put(`/scripts/${id}`, payload);
        message.success('Cập nhật SDK Script thành công!');
      } else {
        await api.post('/scripts', payload);
        message.success('Thêm SDK Script mới thành công!');
      }
      navigate('/scripts');
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

  if (forceFormView) {
    return (
      <div style={{ padding: '0', width: '100%', margin: '0 auto' }}>
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/scripts')}
                style={{ color: '#94a3b8', padding: '0 8px' }}
              />
              <span style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>
                {isEditing ? 'Soạn thảo Bridge Script' : 'Tạo mới Bridge Script'}
              </span>
            </div>
          }
          bordered={false}
          style={{
            background: 'rgba(30, 41, 59, 0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '5px',
          }}
          loading={loading}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFormSubmit}
            requiredMark={false}
          >
            <Row gutter={24}>
              <Col span={8}>
                <Form.Item
                  name="type"
                  label={<span style={{ color: '#e2e8f0' }}>Loại SDK Bridge (Type Key)</span>}
                  rules={[
                    { required: true, message: 'Nhập loại SDK!' },
                    { pattern: /^[a-z0-9-_.]+$/, message: 'Mã chỉ bao gồm chữ thường không dấu, số, dấu chấm, gạch ngang/dưới!' }
                  ]}
                >
                  <Input
                    prefix={<CodeOutlined style={{ color: '#94a3b8' }} />}
                    placeholder="Ví dụ: payment, tracking, notification"
                    disabled={isEditing}
                    style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </Form.Item>

                <Form.Item
                  name="version"
                  label={<span style={{ color: '#e2e8f0' }}>Phiên bản SDK</span>}
                  rules={[{ required: true, message: 'Nhập phiên bản!' }]}
                >
                  <Input
                    prefix={<FileTextOutlined style={{ color: '#94a3b8' }} />}
                    placeholder="Ví dụ: 1.2.0"
                    style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </Form.Item>

                <Form.Item
                  name="description"
                  label={<span style={{ color: '#e2e8f0' }}>Mô tả chức năng</span>}
                >
                  <Input.TextArea
                    rows={4}
                    placeholder="Script này giúp Mini App gọi các cổng thanh toán của Host App"
                    style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </Form.Item>

                <Form.Item
                  name="is_actived"
                  label={<span style={{ color: '#e2e8f0' }}>Kích hoạt Hoạt động</span>}
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              
              <Col span={16}>
                <Form.Item
                  name="content"
                  label={<span style={{ color: '#e2e8f0' }}>Nội dung mã Adapter JavaScript (JS)</span>}
                  rules={[{ required: true, message: 'Nhập mã nguồn JS!' }]}
                  style={{ marginBottom: '16px' }}
                >
                  <Input.TextArea
                    rows={18}
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

                <Form.Item style={{ marginBottom: 0, marginTop: '24px', textAlign: 'right' }}>
                  <Space>
                    <Button onClick={() => navigate('/scripts')} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none' }}>
                      Hủy bỏ
                    </Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={submitting}
                      style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none' }}
                    >
                      {isEditing ? 'Cập nhật' : 'Thêm mới'}
                    </Button>
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>
      </div>
    );
  }

  return (
    <div>
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
    </div>
  );
}
