import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Form, Input, Card, Badge, Tooltip, message, Row, Col, Typography, Modal } from 'antd';
import { PlusOutlined, CodeOutlined, FileTextOutlined, ArrowLeftOutlined, ReloadOutlined, EyeOutlined, CopyOutlined, HistoryOutlined } from '@ant-design/icons';
import { api } from '../services/api';
import { useNavigate, useParams } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

export default function ScriptTab({ currentUser, forceFormView = false }) {
  const [activeScript, setActiveScript] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const scriptPerm = currentUser?.username === 'admin' ? 7 : (currentUser?.menu_permissions?.['scripts'] || 0);
  const canAdd = (scriptPerm & 1) === 1;
  const [previewScript, setPreviewScript] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  // If forceFormView is true, we are creating a new version.
  // If we have an id in the URL, we are creating a new version based on a historical version (pre-fills its content).
  const isEditing = forceFormView && !!id;

  const fetchActiveAndHistory = async () => {
    setLoading(true);
    try {
      // Fetch active script
      const activeRes = await api.get('/scripts');
      setActiveScript(activeRes.data);

      // Fetch history
      const historyRes = await api.get('/scripts/history');
      setHistory(historyRes.data || []);
    } catch (err) {
      message.error('Không thể tải dữ liệu SDK scripts: ' + err.message);
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
      // Pre-fill form fields
      form.setFieldsValue({
        version: '', // Let them enter the new version number
        description: `Dựa trên phiên bản v${script.version} - `,
        content: script.content
      });
    } catch (err) {
      message.error('Không thể tải thông tin bản ghi lịch sử: ' + err.message);
      navigate('/scripts');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveForNewForm = async () => {
    setLoading(true);
    try {
      const activeRes = await api.get('/scripts');
      const active = activeRes.data;
      if (active) {
        // Prefill new form with latest active code
        form.setFieldsValue({
          version: '',
          description: '',
          content: active.content
        });
      } else {
        // Default boilerplate if no script exists yet
        form.setFieldsValue({
          version: '1.0.0',
          description: 'Phiên bản khởi tạo đầu tiên',
          content: `// Hướng dẫn Adapter Script:\n// Nhận vào tham số và tương tác với Host Bridge\n(function() {\n  console.log("SDK Bridge initialized");\n  window.MiniAppBridge = {\n    call: function(action, params) {\n       console.log("Call bridge action:", action, params);\n       return Promise.resolve({ success: true });\n    }\n  };\n})();`
        });
      }
    } catch (err) {
      message.error('Lỗi khi tải mã nguồn hiện tại: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (forceFormView) {
      if (!canAdd) {
        message.error('Bạn không có quyền thực hiện thao tác này!');
        navigate('/scripts');
        return;
      }
      if (isEditing) {
        fetchScriptDetails();
      } else {
        form.resetFields();
        fetchActiveForNewForm();
      }
    } else {
      fetchActiveAndHistory();
    }
  }, [forceFormView, id, canAdd, navigate]);

  const handleCreateClick = () => {
    if (!currentUser) {
      message.warning('Bạn cần đăng nhập để tạo phiên bản SDK Script mới!');
      return;
    }
    navigate('/scripts/new');
  };

  const handleCreateFromVersion = (versionId) => {
    if (!currentUser) {
      message.warning('Bạn cần đăng nhập để thao tác!');
      return;
    }
    navigate(`/scripts/${versionId}/edit`);
  };

  const handleViewDetails = async (versionId) => {
    setLoading(true);
    try {
      const res = await api.get(`/scripts/${versionId}`);
      setPreviewScript(res.data);
      setPreviewVisible(true);
    } catch (err) {
      message.error('Không thể tải chi tiết phiên bản: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        version: values.version,
        description: values.description,
        content: values.content
      };

      // Always create a new version (POST) to maintain change history
      await api.post('/scripts', payload);
      message.success(`Thêm phiên bản mới v${values.version} thành công!`);
      navigate('/scripts');
    } catch (err) {
      message.error(err.message || 'Lưu phiên bản mới thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: '#ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Phiên bản',
      dataIndex: 'version',
      key: 'version',
      width: 120,
      render: (v) => <code style={{ color: '#eab308', fontWeight: 600 }}>v{v}</code>
    },
    {
      title: 'Mô tả thay đổi',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => <span style={{ color: '#cbd5e1' }}>{text || '—'}</span>
    },
    {
      title: 'Ngày cập nhật',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 220,
      render: (date) => <span style={{ color: '#94a3b8' }}>{new Date(date).toLocaleString('vi-VN')}</span>
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 180,
      render: (_, record) => {
        return (
          <Space size="middle">
            <Tooltip title="Xem chi tiết mã nguồn">
              <Button
                type="text"
                icon={<EyeOutlined style={{ color: '#38bdf8' }} />}
                onClick={() => handleViewDetails(record.id)}
              />
            </Tooltip>
            <Tooltip title={currentUser && canAdd ? "Tạo bản mới dựa trên bản này" : "Bạn không có quyền thao tác"}>
              <Button
                type="text"
                icon={<CopyOutlined style={{ color: currentUser && canAdd ? '#a5b4fc' : '#64748b' }} />}
                onClick={() => handleCreateFromVersion(record.id)}
                disabled={!currentUser || !canAdd}
              />
            </Tooltip>
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
                {isEditing ? 'Tạo phiên bản mới từ lịch sử' : 'Phát hành phiên bản Bridge Script mới'}
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
              <Col xs={24} md={8}>
                <Form.Item
                  name="version"
                  label={<span style={{ color: '#e2e8f0' }}>Số phiên bản (Version)</span>}
                  rules={[
                    { required: true, message: 'Nhập số phiên bản!' },
                    { pattern: /^[0-9.]+$/, message: 'Chỉ bao gồm số và dấu chấm (ví dụ: 1.2.0)' }
                  ]}
                >
                  <Input
                    placeholder="Ví dụ: 1.2.0"
                    style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </Form.Item>

                <Form.Item
                  name="description"
                  label={<span style={{ color: '#e2e8f0' }}>Mô tả các thay đổi (Changelog)</span>}
                  rules={[{ required: true, message: 'Vui lòng nhập mô tả thay đổi!' }]}
                >
                  <Input.TextArea
                    rows={6}
                    placeholder="Mô tả ngắn gọn những điểm mới hoặc sửa đổi trong phiên bản script này để lưu lại lịch sử..."
                    style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </Form.Item>
                
                <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '6px', border: '1px dashed rgba(99, 102, 241, 0.2)' }}>
                  <Title level={5} style={{ color: '#a5b4fc', fontSize: '13px', marginTop: 0 }}>Lưu ý về lịch sử</Title>
                  <Paragraph style={{ color: '#94a3b8', fontSize: '12px', marginBottom: 0, lineHeight: 1.5 }}>
                    Mỗi lần phát hành sẽ tạo thêm 1 bản ghi lịch sử và phiên bản mới nhất sẽ ngay lập tức được đặt làm bản script hoạt động (Active) cho toàn hệ thống Mini App.
                  </Paragraph>
                </div>
              </Col>
              
              <Col xs={24} md={16}>
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
                      Phát hành (Release)
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
      {/* 1. Current Active Script Display */}
      {activeScript ? (
        <Card
          bordered={false}
          style={{
            background: 'rgba(30, 41, 59, 0.4)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '8px',
            marginBottom: '24px'
          }}
          loading={loading}
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} md={10} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <Badge count="Active" style={{ backgroundColor: '#10b981', boxShadow: 'none' }} />
                  <span style={{ fontSize: '24px', fontWeight: 700, color: '#eab308' }}>
                    v{activeScript.version}
                  </span>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <Text style={{ color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Mô tả phiên bản:</Text>
                  <Paragraph style={{ color: '#f1f5f9', fontSize: '13px', background: 'rgba(15, 23, 42, 0.4)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)', marginBottom: 0 }}>
                    {activeScript.description || 'Không có mô tả.'}
                  </Paragraph>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <Text style={{ color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Thời gian cập nhật:</Text>
                  <Text style={{ color: '#cbd5e1', fontWeight: 500 }}>
                    {new Date(activeScript.created_at).toLocaleString('vi-VN')}
                  </Text>
                </div>
              </div>

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
                    Tạo Phiên Bản Mới
                  </Button>
                )}
                <Button
                  type="default"
                  icon={<ReloadOutlined />}
                  onClick={fetchActiveAndHistory}
                  loading={loading}
                  style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  Làm mới
                </Button>
              </Space>
            </Col>
            <Col xs={24} md={14}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <Text style={{ color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CodeOutlined style={{ color: '#6366f1' }} />
                  Mã nguồn hiện tại (Active JavaScript SDK)
                </Text>
                <Button
                  type="text"
                  icon={<CopyOutlined style={{ color: '#94a3b8' }} />}
                  onClick={() => {
                    navigator.clipboard.writeText(activeScript.content);
                    message.success('Đã sao chép mã nguồn vào clipboard!');
                  }}
                  style={{ padding: '0 8px' }}
                >
                  <span style={{ color: '#94a3b8', fontSize: '12px' }}>Sao chép</span>
                </Button>
              </div>
              <Input.TextArea
                readOnly
                value={activeScript.content}
                rows={9}
                style={{
                  fontFamily: '"Fira Code", Consolas, Monaco, "Courier New", monospace',
                  fontSize: '12px',
                  background: '#090d16',
                  color: '#4ade80',
                  border: '1px solid rgba(255,255,255,0.1)',
                  lineHeight: '1.5',
                  borderRadius: '6px',
                  resize: 'none'
                }}
              />
            </Col>
          </Row>
        </Card>
      ) : (
        <Card
          bordered={false}
          style={{
            background: 'rgba(30, 41, 59, 0.4)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '8px',
            marginBottom: '24px',
            textAlign: 'center',
            padding: '40px 20px'
          }}
          loading={loading}
        >
          <CodeOutlined style={{ fontSize: '48px', color: '#6366f1', marginBottom: '16px' }} />
          <Title level={4} style={{ color: '#fff', marginBottom: '8px' }}>Chưa có Bridge Script hoạt động</Title>
          <Paragraph style={{ color: '#94a3b8', marginBottom: '24px' }}>
            Vui lòng tạo phiên bản đầu tiên của SDK Bridge Adapter Script để kích hoạt kết nối cho các Mini App.
          </Paragraph>
          {canAdd && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateClick}
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                border: 'none',
                fontWeight: 600,
              }}
            >
              Tạo phiên bản đầu tiên
            </Button>
          )}
        </Card>
      )}

      {/* 2. Version History Table */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HistoryOutlined style={{ color: '#6366f1' }} />
            <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Lịch sử phiên bản thay đổi</span>
          </div>
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
          dataSource={history.map(s => ({ ...s, key: s.id }))}
          loading={loading}
          pagination={{ pageSize: 6, showSizeChanger: false }}
          locale={{ emptyText: <span style={{ color: '#94a3b8' }}>Chưa có bản ghi lịch sử nào.</span> }}
          style={{ background: 'transparent' }}
          className="custom-table"
          size="small"
        />
      </Card>

      {/* 3. History Preview Modal */}
      <Modal
        title={
          <div style={{ color: '#fff' }}>
            Chi tiết phiên bản <code style={{ color: '#eab308' }}>v{previewScript?.version}</code>
          </div>
        }
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none' }}>
            Đóng lại
          </Button>,
          currentUser && canAdd && (
            <Button
              key="restore"
              type="primary"
              icon={<CopyOutlined />}
              onClick={() => {
                setPreviewVisible(false);
                handleCreateFromVersion(previewScript.id);
              }}
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none' }}
            >
              Tạo bản mới từ bản này
            </Button>
          )
        ].filter(Boolean)}
        width={800}
        styles={{
          body: {
            background: '#1e293b',
            color: '#fff',
            padding: '20px 0 0 0'
          },
          content: {
            background: '#1e293b',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }
        }}
      >
        {previewScript && (
          <div>
            <div style={{ marginBottom: '16px', background: 'rgba(15, 23, 42, 0.4)', padding: '12px', borderRadius: '6px' }}>
              <Text style={{ color: '#94a3b8', display: 'block', marginBottom: '4px', fontSize: '12px' }}>Mô tả các thay đổi:</Text>
              <Text style={{ color: '#f1f5f9', fontSize: '13px' }}>{previewScript.description || 'Không có mô tả.'}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <Text style={{ color: '#94a3b8', fontSize: '12px' }}>Nội dung JavaScript:</Text>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined style={{ color: '#94a3b8' }} />}
                onClick={() => {
                  navigator.clipboard.writeText(previewScript.content);
                  message.success('Đã sao chép mã nguồn vào clipboard!');
                }}
              >
                <span style={{ color: '#94a3b8', fontSize: '11px' }}>Sao chép</span>
              </Button>
            </div>
            <Input.TextArea
              readOnly
              value={previewScript.content}
              rows={14}
              style={{
                fontFamily: '"Fira Code", Consolas, Monaco, "Courier New", monospace',
                fontSize: '12px',
                background: '#090d16',
                color: '#4ade80',
                border: '1px solid rgba(255,255,255,0.1)',
                lineHeight: '1.5',
                borderRadius: '6px',
                resize: 'none'
              }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
