import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Space, Select, Input, Modal, Badge, Tooltip, message, Row, Col } from 'antd';
import { SearchOutlined, ReloadOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import { api, getAuthData } from '../services/api';

const ACTION_LABELS = {
  'APPROVE_BUILD': { text: 'Duyệt bản build', color: 'success' },
  'REJECT_BUILD': { text: 'Từ chối bản build', color: 'error' },
  'ACTIVATE_APP': { text: 'Kích hoạt Mini App', color: 'processing' },
  'DEACTIVATE_APP': { text: 'Dừng hoạt động Mini App', color: 'warning' }
};

const CHECKLIST_LABELS = {
  'legal_content': 'Nội dung hợp pháp (không cờ bạc, 18+...)',
  'payment_iap': 'Cấu hình thanh toán hợp lệ (IAP / Physical)',
  'min_permissions': 'Quyền truy cập tối thiểu (không xin thừa)',
  'domain_https': 'Đường dẫn HTTPS an toàn',
  'privacy_policy': 'Chính sách bảo mật dữ liệu',
  'no_bridge_abuse': 'Không lạm dụng JS bridge',
  'stability_check': 'Ứng dụng tải nhanh, ổn định'
};

export default function ModerationLogTab() {
  const [logs, setLogs] = useState([]);
  const [miniApps, setMiniApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchMiniApps = async () => {
    try {
      const res = await api.get('/mini-apps?include_hidden=true&include_inactive=true');
      setMiniApps(res.data || res || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogs = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      let query = `?page=${page}&limit=${pageSize}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (selectedApp) query += `&mini_app_id=${selectedApp}`;
      if (selectedAction) query += `&action=${selectedAction}`;

      const res = await api.get(`/moderation-logs${query}`);
      const data = res.data || res;
      setLogs(data.logs || []);
      setPagination({
        current: data.page,
        pageSize: data.limit,
        total: data.total
      });
    } catch (err) {
      message.error('Không thể tải lịch sử kiểm duyệt: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMiniApps();
    fetchLogs(1, pagination.pageSize);
  }, [selectedApp, selectedAction]);

  const handleTableChange = (pagination) => {
    fetchLogs(pagination.current, pagination.pageSize);
  };

  const handleSearch = () => {
    fetchLogs(1, pagination.pageSize);
  };

  const handleReset = () => {
    setSearch('');
    setSelectedApp(null);
    setSelectedAction(null);
    fetchLogs(1, pagination.pageSize);
  };

  const handleExportCsv = async () => {
    try {
      message.loading({ content: 'Đang chuẩn bị dữ liệu xuất...', key: 'exportLogs' });
      const { accessToken } = getAuthData();
      const response = await fetch('http://localhost:3000/api/moderation-logs/export', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (!response.ok) throw new Error('Xuất báo cáo thất bại');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `moderation_logs_${Math.round(Date.now() / 1000)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      message.success({ content: 'Xuất file Excel (CSV) thành công!', key: 'exportLogs' });
    } catch (err) {
      message.error({ content: 'Lỗi khi xuất file: ' + err.message, key: 'exportLogs' });
    }
  };

  const showDetails = (log) => {
    setSelectedLog(log);
    setDetailModalOpen(true);
  };

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (date) => <span style={{ color: '#94a3b8' }}>{new Date(date).toLocaleString('vi-VN')}</span>,
    },
    {
      title: 'Người thực hiện',
      dataIndex: 'performed_by',
      key: 'performed_by',
      width: 140,
      fontWeight: 'bold',
      render: (text) => <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{text}</span>,
    },
    {
      title: 'Ứng dụng',
      key: 'mini_app',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, color: '#f8fafc' }}>{record.mini_app_name || 'Hệ thống/Đã xóa'}</div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>{record.mini_app_identifier || '—'}</div>
        </div>
      )
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      width: 220,
      render: (action) => {
        const info = ACTION_LABELS[action] || { text: action, color: 'default' };
        return <Badge status={info.color} text={<span style={{ color: '#e2e8f0' }}>{info.text}</span>} />;
      }
    },
    {
      title: 'Phiên bản',
      dataIndex: 'version',
      key: 'version',
      width: 100,
      render: (text) => text ? <code style={{ color: '#eab308', fontWeight: 600 }}>v{text}</code> : <span style={{ color: '#64748b' }}>—</span>,
    },
    {
      title: 'Chi tiết',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Tooltip title="Xem chi tiết kiểm duyệt">
          <Button
            type="text"
            icon={<EyeOutlined style={{ color: '#6366f1' }} />}
            onClick={() => showDetails(record)}
          />
        </Tooltip>
      )
    }
  ];

  return (
    <div>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>Nhật ký kiểm duyệt & Bảo mật (Super App Audit Trail)</span>
          </div>
        }
        extra={
          <Space>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExportCsv}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
              }}
            >
              Xuất Excel (CSV)
            </Button>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={() => fetchLogs(pagination.current, pagination.pageSize)}
              loading={loading}
              style={{ background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)', color: '#a5b4fc' }}
            >
              Làm mới
            </Button>
          </Space>
        }
        bordered={false}
        style={{
          background: 'rgba(30, 41, 59, 0.4)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '5px',
        }}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {/* Filtering row */}
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={6}>
              <Select
                placeholder="Lọc theo ứng dụng..."
                style={{ width: '100%' }}
                value={selectedApp}
                onChange={setSelectedApp}
                allowClear
                dropdownStyle={{ background: '#1e293b' }}
              >
                {miniApps.map(app => (
                  <Select.Option key={app.id} value={app.id}>{app.name}</Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={6}>
              <Select
                placeholder="Lọc theo hành động..."
                style={{ width: '100%' }}
                value={selectedAction}
                onChange={setSelectedAction}
                allowClear
                dropdownStyle={{ background: '#1e293b' }}
              >
                {Object.keys(ACTION_LABELS).map(key => (
                  <Select.Option key={key} value={key}>{ACTION_LABELS[key].text}</Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={8}>
              <Input
                placeholder="Tìm theo người thực hiện, phiên bản..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onPressEnter={handleSearch}
                prefix={<SearchOutlined style={{ color: '#64748b' }} />}
                style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </Col>
            <Col xs={24} sm={4}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={handleReset} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none' }}>
                  Xóa lọc
                </Button>
                <Button type="primary" onClick={handleSearch} style={{ background: '#6366f1', border: 'none' }}>
                  Tìm kiếm
                </Button>
              </Space>
            </Col>
          </Row>

          <Table
            columns={columns}
            dataSource={logs}
            rowKey="id"
            loading={loading}
            pagination={pagination}
            onChange={handleTableChange}
            bordered={false}
            style={{ background: 'transparent' }}
            className="dark-table"
          />
        </Space>
      </Card>

      {/* Detail Checklist Modal */}
      <Modal
        title={
          <span style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>
            Chi tiết kiểm duyệt - {selectedLog?.mini_app_name || 'Hệ thống'}
          </span>
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setDetailModalOpen(false)} style={{ background: '#6366f1', border: 'none' }}>
            Đóng
          </Button>
        ]}
        width={720}
        wrapClassName="dark-modal"
      >
        {selectedLog && (
          <div style={{ color: '#cbd5e1', fontSize: '13px' }}>
            <Row gutter={24}>
              {/* Left Column: Thông tin phiên bản (40% - span 10) */}
              <Col span={10} style={{ borderRight: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <h4 style={{ color: '#818cf8', marginBottom: '16px' }}>Thông tin phiên bản</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <strong style={{ color: '#94a3b8' }}>Người thực hiện:</strong>
                    <div style={{ marginTop: '4px', color: '#f8fafc', fontWeight: 600 }}>{selectedLog.performed_by}</div>
                  </div>
                  <div>
                    <strong style={{ color: '#94a3b8' }}>Thời gian:</strong>
                    <div style={{ marginTop: '4px', color: '#f8fafc' }}>{new Date(selectedLog.created_at).toLocaleString('vi-VN')}</div>
                  </div>
                  <div>
                    <strong style={{ color: '#94a3b8' }}>Phiên bản:</strong>
                    <div style={{ marginTop: '4px' }}>
                      <code style={{ color: '#eab308', fontSize: '13px', fontWeight: 600 }}>v{selectedLog.version || '—'}</code>
                    </div>
                  </div>
                  <div>
                    <strong style={{ color: '#94a3b8' }}>Hành động:</strong>
                    <div style={{ marginTop: '4px' }}>
                      {(() => {
                        const info = ACTION_LABELS[selectedLog.action] || { text: selectedLog.action, color: 'default' };
                        return <Badge status={info.color} text={<span style={{ color: '#e2e8f0', fontWeight: 500 }}>{info.text}</span>} />;
                      })()}
                    </div>
                  </div>
                </div>
              </Col>

              {/* Right Column: Kết quả kiểm duyệt (60% - span 14) */}
              <Col span={14}>
                <h4 style={{ color: '#818cf8', marginBottom: '16px' }}>Kết quả kiểm duyệt</h4>
                
                {/* Ghi chú duyệt */}
                {selectedLog.checklist && selectedLog.checklist.notes && (
                  <div style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <strong style={{ color: '#cbd5e1' }}>Ghi chú duyệt:</strong>
                    <p style={{ margin: '6px 0 0 0', color: '#94a3b8', whiteSpace: 'pre-wrap' }}>{selectedLog.checklist.notes}</p>
                  </div>
                )}

                {/* Lý do từ chối */}
                {selectedLog.checklist && selectedLog.checklist.reason && (
                  <div style={{ marginBottom: '16px', background: 'rgba(239, 68, 68, 0.08)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <strong style={{ color: '#f87171' }}>Lý do từ chối:</strong>
                    <p style={{ margin: '6px 0 0 0', color: '#fca5a5', whiteSpace: 'pre-wrap' }}>{selectedLog.checklist.reason}</p>
                  </div>
                )}

                {/* Danh sách checklist */}
                <div style={{ marginTop: '12px' }}>
                  <strong style={{ color: '#cbd5e1', display: 'block', marginBottom: '12px' }}>Checklist kiểm tra tiêu chí an toàn:</strong>
                  {selectedLog.checklist && selectedLog.checklist.checks ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {Object.keys(selectedLog.checklist.checks).map(k => (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} key={k}>
                          <Badge status={selectedLog.checklist.checks[k] ? 'success' : 'error'} />
                          <span style={{ 
                            textDecoration: selectedLog.checklist.checks[k] ? 'none' : 'line-through', 
                            color: selectedLog.checklist.checks[k] ? '#f8fafc' : '#64748b', 
                            fontSize: '12px' 
                          }}>
                            {CHECKLIST_LABELS[k] || k}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#64748b', fontStyle: 'italic' }}>Không có checklist đánh giá (Thao tác thay đổi cờ cấu hình/kích hoạt).</p>
                  )}
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
}
