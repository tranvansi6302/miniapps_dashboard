import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Card,
  Tag,
  Tooltip,
  Switch,
  Row,
  Col,
  Drawer,
  message,
  Popconfirm,
  Upload,
  Typography,
  Divider,
  Spin,
  Checkbox,
  Progress
} from 'antd';
import {
  PlusOutlined,
  SlidersOutlined,
  ReloadOutlined,
  SearchOutlined,
  UploadOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  AppstoreOutlined,
  BranchesOutlined,
  FileZipOutlined,
  SafetyCertificateOutlined,
  CameraOutlined,
  CompassOutlined,
  FolderOpenOutlined,
  AudioOutlined,
  BellOutlined,
  EyeInvisibleOutlined,
  GlobalOutlined,
  ExportOutlined,
  RocketOutlined,
  CloudServerOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { api } from '../services/api';

const { Text } = Typography;

const PERMISSION_OPTIONS = [
  { label: 'Camera', value: 'camera', icon: <CameraOutlined /> },
  { label: 'Vị trí (Location)', value: 'location', icon: <CompassOutlined /> },
  { label: 'Lưu trữ (Storage)', value: 'storage', icon: <FolderOpenOutlined /> },
  { label: 'Microphone', value: 'microphone', icon: <AudioOutlined /> },
  { label: 'Thông báo đẩy (Push)', value: 'push_notification', icon: <BellOutlined /> }
];

export default function MiniAppTab({ currentUser }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Edit / Create App Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // Upload Build Modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedAppForBuild, setSelectedAppForBuild] = useState(null);
  const [uploadForm] = Form.useForm();
  const [uploadingZip, setUploadingZip] = useState(false);
  const [submittingBuild, setSubmittingBuild] = useState(false);

  // Builds List Drawer
  const [isBuildsDrawerOpen, setIsBuildsDrawerOpen] = useState(false);
  const [currentAppBuilds, setCurrentAppBuilds] = useState(null);
  const [buildsList, setBuildsList] = useState([]);
  const [loadingBuilds, setLoadingBuilds] = useState(false);

  // Load MiniApps
  const fetchApps = async () => {
    setLoading(true);
    try {
      const res = await api.get('/mini-apps?include_inactive=true');
      setApps(res.data || []);
    } catch (err) {
      message.error(err.message || 'Không thể tải danh sách Mini App');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  // Fetch builds for a specific MiniApp
  const fetchBuilds = async (app) => {
    if (!app) return;
    setLoadingBuilds(true);
    try {
      const res = await api.get(`/mini-apps/${app.id}/builds`);
      setBuildsList(res.data || []);
    } catch (err) {
      message.error(err.message || 'Không thể tải danh sách bản build');
    } finally {
      setLoadingBuilds(false);
    }
  };

  // Open Edit/Create Drawer
  const handleOpenDrawer = (app = null) => {
    setEditingApp(app);
    if (app) {
      let permissions = app.permissions || ['camera', 'location', 'storage'];
      if (typeof permissions === 'string') {
        try { permissions = JSON.parse(permissions); } catch (e) { permissions = []; }
      }

      form.setFieldsValue({
        app_id: app.app_id,
        name: app.name,
        icon_url: app.icon_url,
        short_description: app.short_description,
        description: app.description,
        url: app.url,
        version: app.version || '1.0.0',
        terms_url: app.terms_url,
        privacy_policy_url: app.privacy_policy_url,
        permissions: permissions,
        is_actived: app.is_actived !== false,
        is_maintenance: app.is_maintenance === true,
        requires_auth: app.requires_auth === true,
        is_hidden: app.is_hidden === true
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        version: '1.0.0',
        permissions: ['camera', 'location', 'storage'],
        is_actived: true,
        is_maintenance: false,
        requires_auth: false,
        is_hidden: false
      });
    }
    setIsDrawerOpen(true);
  };

  // Save MiniApp
  const handleSaveApp = async (values) => {
    setSubmitting(true);
    try {
      if (editingApp) {
        await api.put(`/mini-apps/${editingApp.id}`, values);
        message.success('Cập nhật Mini App thành công!');
      } else {
        await api.post('/mini-apps', values);
        message.success('Tạo mới Mini App thành công!');
      }
      setIsDrawerOpen(false);
      fetchApps();
    } catch (err) {
      message.error(err.message || 'Thao tác thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete MiniApp
  const handleDeleteApp = async (id) => {
    try {
      await api.delete(`/mini-apps/${id}`);
      message.success('Đã xóa Mini App thành công!');
      fetchApps();
    } catch (err) {
      message.error(err.message || 'Xóa Mini App thất bại');
    }
  };

  // Open Upload Build Modal
  const handleOpenUploadBuild = (app) => {
    setSelectedAppForBuild(app);
    uploadForm.resetFields();
    uploadForm.setFieldsValue({
      version: app.version || '1.0.0',
      changelog: '',
      reviewer_notes: ''
    });
    setIsUploadModalOpen(true);
  };

  // Custom Zip File Upload
  const handleZipUpload = async (file) => {
    setUploadingZip(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('app_id', selectedAppForBuild?.app_id || 'app');
    formData.append('version', uploadForm.getFieldValue('version') || '1.0.0');

    try {
      const res = await api.post('/mini-apps/upload', formData);
      const { file_path, file_hash, file_size } = res.data;
      uploadForm.setFieldsValue({
        file_path,
        file_hash,
        file_size
      });
      message.success('Tải lên file bundle .zip thành công!');
    } catch (err) {
      message.error(err.message || 'Tải lên thất bại');
    } finally {
      setUploadingZip(false);
    }
    return false;
  };

  // Submit Build
  const handleSubmitBuild = async (values) => {
    if (!values.file_path || !values.file_hash) {
      message.warning('Vui lòng tải lên file bundle .zip trước!');
      return;
    }

    setSubmittingBuild(true);
    try {
      await api.post(`/mini-apps/${selectedAppForBuild.id}/builds`, {
        version: values.version,
        file_path: values.file_path,
        file_hash: values.file_hash,
        file_size: values.file_size,
        changelog: values.changelog,
        reviewer_notes: values.reviewer_notes
      });
      message.success('Nộp bản build thành công (Trạng thái: Chờ duyệt)!');
      setIsUploadModalOpen(false);
      fetchApps();
      if (currentAppBuilds && currentAppBuilds.id === selectedAppForBuild.id) {
        fetchBuilds(currentAppBuilds);
      }
    } catch (err) {
      message.error(err.message || 'Nộp bản build thất bại');
    } finally {
      setSubmittingBuild(false);
    }
  };

  // Open Builds Drawer
  const handleOpenBuildsDrawer = (app) => {
    setCurrentAppBuilds(app);
    setIsBuildsDrawerOpen(true);
    fetchBuilds(app);
  };

  // Approve / Reject Build
  const handleUpdateBuildStatus = async (buildId, status) => {
    try {
      await api.put(`/mini-apps/${currentAppBuilds.id}/builds/${buildId}/status`, {
        status
      });
      message.success(status === 2 ? 'Đã duyệt và kích hoạt bản build!' : 'Đã từ chối bản build!');
      fetchBuilds(currentAppBuilds);
      fetchApps();
    } catch (err) {
      message.error(err.message || 'Thao tác thất bại');
    }
  };

  // Copy helper
  const copyToClipboard = (text, label = 'Dữ liệu') => {
    navigator.clipboard.writeText(text);
    message.success(`Đã sao chép ${label}!`);
  };

  // Filtered Apps
  const filteredApps = apps.filter(app => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (app.app_id && app.app_id.toLowerCase().includes(s)) ||
      (app.name && app.name.toLowerCase().includes(s))
    );
  });

  // Calculate Statistics dynamically
  const totalApps = apps.length;
  const activeApps = apps.filter(a => a.is_actived).length;
  const activePercent = totalApps > 0 ? Math.round((activeApps / totalApps) * 100) : 0;
  const maintenanceApps = apps.filter(a => a.is_maintenance).length;
  const totalPermsCount = apps.reduce((acc, a) => acc + (a.permissions?.length || 0), 0);
  const latestVersion = apps[0]?.version || '1.0.0';

  // Render Permission Icon Badges
  const renderPermBadges = (permissions) => {
    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
      return <span style={{ color: '#64748b', fontSize: 12 }}>Không có</span>;
    }
    const iconMap = {
      camera: { icon: <CameraOutlined />, label: 'Camera', color: 'cyan' },
      location: { icon: <CompassOutlined />, label: 'Vị trí', color: 'blue' },
      storage: { icon: <FolderOpenOutlined />, label: 'Lưu trữ', color: 'purple' },
      microphone: { icon: <AudioOutlined />, label: 'Mic', color: 'magenta' },
      push_notification: { icon: <BellOutlined />, label: 'Push', color: 'gold' }
    };

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {permissions.map(p => {
          const item = iconMap[p] || { icon: <SafetyCertificateOutlined />, label: p, color: 'default' };
          return (
            <Tag key={p} color={item.color} style={{ fontSize: 12, padding: '0 6px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {item.icon} {item.label}
            </Tag>
          );
        })}
      </div>
    );
  };

  // Table Columns
  const columns = [
    {
      title: 'Mini App',
      key: 'app_info',
      width: 270,
      render: (_, record) => (
        <Space size="middle" align="center">
          {record.icon_url ? (
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              background: '#1e293b',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
            }}>
              <img
                src={record.icon_url}
                alt={record.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
          ) : (
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              boxShadow: '0 2px 6px rgba(99,102,241,0.35)'
            }}>
              {record.name ? record.name[0].toUpperCase() : 'A'}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: 13 }}>
              {record.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <code style={{ fontSize: 12, color: '#a5b4fc', background: 'rgba(99,102,241,0.12)', padding: '1px 6px', borderRadius: 4 }}>
                {record.app_id}
              </code>
              <Tooltip title="Sao chép App ID">
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined style={{ fontSize: 12, color: '#94a3b8' }} />}
                  onClick={() => copyToClipboard(record.app_id, 'App ID')}
                  style={{ width: 20, height: 20, minWidth: 20, padding: 0 }}
                />
              </Tooltip>
            </div>
          </div>
        </Space>
      )
    },
    {
      title: 'Bản Release & Web',
      key: 'version_info',
      width: 240,
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Tag color="purple" style={{ fontWeight: 600, fontSize: 12, borderRadius: 6 }}>
              v{record.version || '1.0.0'}
            </Tag>
            {record.url && (
              <a
                href={record.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: 12,
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  padding: '1px 7px',
                  borderRadius: 5,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  textDecoration: 'none',
                  fontWeight: 500
                }}
              >
                <GlobalOutlined /> Xem Web <ExportOutlined style={{ fontSize: 11 }} />
              </a>
            )}
          </div>
          {record.file_path && (
            <div style={{ marginBottom: 3 }}>
              <a
                href={record.file_path}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
              >
                <FileZipOutlined /> Tải bundle .zip
              </a>
            </div>
          )}
          {record.file_hash && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Tooltip title={record.file_hash}>
                <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
                  SHA256: {record.file_hash.substring(0, 10)}...
                </span>
              </Tooltip>
              <Tooltip title="Sao chép SHA-256 Hash">
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined style={{ fontSize: 12, color: '#94a3b8' }} />}
                  onClick={() => copyToClipboard(record.file_hash, 'Mã SHA-256')}
                  style={{ width: 18, height: 18, minWidth: 18, padding: 0 }}
                />
              </Tooltip>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Quyền Hạn',
      key: 'permissions',
      width: 190,
      render: (_, record) => renderPermBadges(record.permissions)
    },
    {
      title: 'Trạng Thái',
      key: 'status',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <div>
            {record.is_actived ? (
              <Tag color="success" icon={<CheckCircleOutlined />} style={{ borderRadius: 6, fontSize: 12 }}>Hoạt động</Tag>
            ) : (
              <Tag color="error" icon={<CloseCircleOutlined />} style={{ borderRadius: 6, fontSize: 12 }}>Đã khóa</Tag>
            )}
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {record.is_maintenance && (
              <Tag color="warning" style={{ fontSize: 12, margin: 0, borderRadius: 4 }}>Bảo trì</Tag>
            )}
            {record.requires_auth && (
              <Tag color="blue" style={{ fontSize: 12, margin: 0, borderRadius: 4 }}>Cần login</Tag>
            )}
            {record.is_hidden && (
              <Tag color="default" icon={<EyeInvisibleOutlined />} style={{ fontSize: 12, margin: 0, borderRadius: 4 }}>Ẩn</Tag>
            )}
          </div>
        </Space>
      )
    },
    {
      title: 'Thao Tác',
      key: 'actions',
      width: 280,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<UploadOutlined />}
            onClick={() => handleOpenUploadBuild(record)}
            style={{
              height: 32,
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
              borderColor: 'transparent'
            }}
          >
            Upload
          </Button>

          <Button
            size="small"
            icon={<BranchesOutlined />}
            onClick={() => handleOpenBuildsDrawer(record)}
            style={{
              height: 32,
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              background: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              color: '#e2e8f0'
            }}
          >
            Builds
          </Button>

          <Button
            size="small"
            icon={<SlidersOutlined style={{ color: '#a5b4fc' }} />}
            onClick={() => handleOpenDrawer(record)}
            style={{
              height: 32,
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              background: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              color: '#e2e8f0'
            }}
          >
            Sửa
          </Button>

          <Popconfirm
            title="Xác nhận xóa Mini App?"
            description={`Bạn có chắc muốn xóa ứng dụng ${record.name}?`}
            onConfirm={() => handleDeleteApp(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              size="small"
              icon={<DeleteOutlined style={{ color: '#f87171' }} />}
              style={{
                height: 32,
                borderRadius: 6,
                fontSize: 12,
                background: 'rgba(239, 68, 68, 0.08)',
                borderColor: 'rgba(239, 68, 68, 0.2)',
                color: '#f87171'
              }}
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      {/* 1. TOP ANALYTICS & STATS METRIC CARDS */}
      <Row gutter={[12, 12]} style={{ marginBottom: 14 }}>
        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{
              background: 'rgba(30, 41, 59, 0.65)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 8,
              height: '100%'
            }}
            bodyStyle={{ padding: '12px 14px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>TỔNG MINI APP</span>
                <div style={{ color: '#fff', fontSize: 20, fontWeight: 700, lineHeight: 1.2, marginTop: 2 }}>
                  {totalApps}
                </div>
              </div>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 7,
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AppstoreOutlined style={{ fontSize: 18, color: '#818cf8' }} />
              </div>
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircleOutlined /> {activeApps} Đang chạy
              </span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                {maintenanceApps > 0 ? `${maintenanceApps} Bảo trì` : '0 Bảo trì'}
              </span>
            </div>
            <Progress
              percent={activePercent}
              size="small"
              strokeColor="#6366f1"
              trailColor="rgba(255,255,255,0.06)"
              showInfo={false}
              style={{ margin: '6px 0 0 0' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{
              background: 'rgba(30, 41, 59, 0.65)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 8,
              height: '100%'
            }}
            bodyStyle={{ padding: '12px 14px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>TRẠNG THÁI RELEASE</span>
                <div style={{ color: '#38bdf8', fontSize: 20, fontWeight: 700, lineHeight: 1.2, marginTop: 2 }}>
                  {activePercent}% Active
                </div>
              </div>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 7,
                background: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <RocketOutlined style={{ fontSize: 18, color: '#38bdf8' }} />
              </div>
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                Latest: v{latestVersion}
              </span>
              <Tag color="cyan" style={{ margin: 0, fontSize: 12, padding: '0 6px', lineHeight: '18px' }}>
                LIVE BUNDLE
              </Tag>
            </div>
            <Progress
              percent={activePercent}
              size="small"
              strokeColor="#38bdf8"
              trailColor="rgba(255,255,255,0.06)"
              showInfo={false}
              style={{ margin: '6px 0 0 0' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{
              background: 'rgba(30, 41, 59, 0.65)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 8,
              height: '100%'
            }}
            bodyStyle={{ padding: '12px 14px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>QUYỀN THIẾT BỊ</span>
                <div style={{ color: '#c084fc', fontSize: 20, fontWeight: 700, lineHeight: 1.2, marginTop: 2 }}>
                  {totalPermsCount} Active
                </div>
              </div>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 7,
                background: 'rgba(192, 132, 252, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <SafetyCertificateOutlined style={{ fontSize: 18, color: '#c084fc' }} />
              </div>
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Tag color="purple" style={{ fontSize: 12, margin: 0, padding: '0 6px', lineHeight: '18px' }}>Camera</Tag>
              <Tag color="blue" style={{ fontSize: 12, margin: 0, padding: '0 6px', lineHeight: '18px' }}>Location</Tag>
              <Tag color="gold" style={{ fontSize: 12, margin: 0, padding: '0 6px', lineHeight: '18px' }}>Storage</Tag>
            </div>
            <Progress
              percent={totalPermsCount > 0 ? 100 : 0}
              size="small"
              strokeColor="#c084fc"
              trailColor="rgba(255,255,255,0.06)"
              showInfo={false}
              style={{ margin: '6px 0 0 0' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{
              background: 'rgba(30, 41, 59, 0.65)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 8,
              height: '100%'
            }}
            bodyStyle={{ padding: '12px 14px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>HẠ TẦNG HOSTING</span>
                <div style={{ color: '#34d399', fontSize: 20, fontWeight: 700, lineHeight: 1.2, marginTop: 2 }}>
                  Online
                </div>
              </div>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 7,
                background: 'rgba(52, 211, 153, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CloudServerOutlined style={{ fontSize: 18, color: '#34d399' }} />
              </div>
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                Vercel / Supabase
              </span>
              <span style={{ fontSize: 12, color: '#34d399' }}>
                ● 100% Uptime
              </span>
            </div>
            <Progress
              percent={100}
              size="small"
              strokeColor="#34d399"
              trailColor="rgba(255,255,255,0.06)"
              showInfo={false}
              style={{ margin: '6px 0 0 0' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 2. MAIN TABLE CARD WITH INTEGRATED CLEAN TOOLBAR */}
      <Card
        bordered={false}
        style={{
          background: 'rgba(30, 41, 59, 0.65)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 8
        }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
              Danh sách Mini Apps
            </span>
            <Tag color="purple" style={{ margin: 0, fontSize: 12, fontWeight: 600, padding: '0 6px', borderRadius: 4 }}>
              {filteredApps.length}
            </Tag>
          </div>
        }
        extra={
          <Space size="small">
            <Input
              placeholder="Tìm App ID hoặc Tên..."
              prefix={<SearchOutlined style={{ color: '#64748b' }} />}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: 200,
                height: 32,
                borderRadius: 6,
                background: 'rgba(15, 23, 42, 0.6)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                fontSize: 12
              }}
              allowClear
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchApps}
              loading={loading}
              style={{
                height: 32,
                borderRadius: 6,
                background: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                color: '#e2e8f0'
              }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenDrawer(null)}
              style={{
                height: 32,
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 12
              }}
            >
              Tạo Mini App
            </Button>
          </Space>
        }
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={columns}
          dataSource={filteredApps}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: 'Chưa có Mini App nào được tạo' }}
        />
      </Card>

      {/* 3. DRAWER: Create / Edit MiniApp */}
      <Drawer
        title={editingApp ? `Chỉnh sửa: ${editingApp.name}` : 'Tạo mới Mini App'}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        width={480}
        destroyOnClose
        styles={{
          body: { background: '#0f172a' },
          header: { background: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.08)' }
        }}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '8px 0' }}>
            <Button onClick={() => setIsDrawerOpen(false)} style={{ height: 34, borderRadius: 6, fontSize: 12 }}>
              Hủy
            </Button>
            <Button
              type="primary"
              loading={submitting}
              onClick={() => form.submit()}
              style={{ height: 34, borderRadius: 6, fontWeight: 600, fontSize: 12 }}
            >
              Lưu thông tin
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSaveApp}>
          <Form.Item
            name="app_id"
            label={<span style={{ color: '#cbd5e1', fontWeight: 600, fontSize: 13 }}>App ID (Mã định danh duy nhất)</span>}
            rules={[{ required: true, message: 'Vui lòng nhập App ID (ví dụ: main.vfs.dev)' }]}
          >
            <Input
              placeholder="ví dụ: main.vfs.dev, location-app"
              disabled={!!editingApp}
              style={{ borderRadius: 6, fontSize: 13 }}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label={<span style={{ color: '#cbd5e1', fontWeight: 600, fontSize: 13 }}>Tên hiển thị Mini App</span>}
            rules={[{ required: true, message: 'Vui lòng nhập tên ứng dụng' }]}
          >
            <Input
              placeholder="ví dụ: VFS Trade MiniApp"
              style={{ borderRadius: 6, fontSize: 13 }}
            />
          </Form.Item>

          <Form.Item
            name="icon_url"
            label={<span style={{ color: '#cbd5e1', fontSize: 13 }}>Icon URL (Ảnh đại diện)</span>}
          >
            <Input
              placeholder="https://..."
              style={{ borderRadius: 6, fontSize: 13 }}
            />
          </Form.Item>

          {/* Quyền thiết bị (Permissions) */}
          <Form.Item
            name="permissions"
            label={<span style={{ color: '#cbd5e1', fontWeight: 600, fontSize: 13 }}>Quyền thiết bị (Permissions)</span>}
          >
            <Checkbox.Group style={{ width: '100%' }}>
              <Row gutter={[6, 6]}>
                {PERMISSION_OPTIONS.map(opt => (
                  <Col span={12} key={opt.value}>
                    <div style={{
                      background: 'rgba(30, 41, 59, 0.6)',
                      padding: '6px 8px',
                      borderRadius: 6,
                      border: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <Checkbox value={opt.value}>
                        <span style={{ color: '#e2e8f0', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {opt.icon} {opt.label}
                        </span>
                      </Checkbox>
                    </div>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </Form.Item>

          <Form.Item
            name="short_description"
            label={<span style={{ color: '#cbd5e1', fontSize: 13 }}>Mô tả ngắn</span>}
          >
            <Input.TextArea
              autoSize={{ minRows: 2, maxRows: 4 }}
              placeholder="Mô tả tóm tắt ứng dụng..."
              style={{ background: 'rgba(30, 41, 59, 0.6)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 13 }}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={<span style={{ color: '#cbd5e1', fontSize: 13 }}>Mô tả chi tiết</span>}
          >
            <Input.TextArea
              autoSize={{ minRows: 2, maxRows: 6 }}
              placeholder="Chi tiết tính năng..."
              style={{ background: 'rgba(30, 41, 59, 0.6)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 13 }}
            />
          </Form.Item>

          <Form.Item
            name="url"
            label={<span style={{ color: '#cbd5e1', fontSize: 13 }}>Webview URL (Link web trực tiếp)</span>}
          >
            <Input
              placeholder="https://..."
              style={{ borderRadius: 6, fontSize: 13 }}
            />
          </Form.Item>

          <Row gutter={10}>
            <Col span={12}>
              <Form.Item
                name="terms_url"
                label={<span style={{ color: '#cbd5e1', fontSize: 13 }}>Điều khoản dịch vụ URL</span>}
              >
                <Input placeholder="https://..." style={{ borderRadius: 6, fontSize: 13 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="privacy_policy_url"
                label={<span style={{ color: '#cbd5e1', fontSize: 13 }}>Chính sách bảo mật URL</span>}
              >
                <Input placeholder="https://..." style={{ borderRadius: 6, fontSize: 13 }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '12px 0' }} />

          <Row gutter={10}>
            <Col span={6}>
              <Form.Item name="is_actived" label={<span style={{ color: '#cbd5e1', fontSize: 12 }}>Kích hoạt</span>} valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="is_maintenance" label={<span style={{ color: '#cbd5e1', fontSize: 12 }}>Bảo trì</span>} valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="requires_auth" label={<span style={{ color: '#cbd5e1', fontSize: 12 }}>Cần Login</span>} valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="is_hidden" label={<span style={{ color: '#cbd5e1', fontSize: 12 }}>Ẩn App</span>} valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>

      {/* 4. MODAL: Upload New Build */}
      <Modal
        title={`Nộp bản build: ${selectedAppForBuild?.name}`}
        open={isUploadModalOpen}
        onCancel={() => setIsUploadModalOpen(false)}
        footer={null}
        width={460}
        styles={{ content: { background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 } }}
        destroyOnClose
        centered
      >
        <Form form={uploadForm} layout="vertical" onFinish={handleSubmitBuild}>
          <Form.Item
            name="version"
            label={<span style={{ color: '#cbd5e1', fontWeight: 600, fontSize: 13 }}>Phiên bản (Version)</span>}
            rules={[{ required: true, message: 'Vui lòng nhập phiên bản' }]}
          >
            <Input
              placeholder="ví dụ: 1.0.1"
              style={{ borderRadius: 6, fontSize: 13 }}
            />
          </Form.Item>

          <Form.Item label={<span style={{ color: '#cbd5e1', fontWeight: 600, fontSize: 13 }}>Tệp bundle nén (.zip)</span>} required>
            <Upload.Dragger
              beforeUpload={handleZipUpload}
              showUploadList={false}
              accept=".zip"
              disabled={uploadingZip}
              style={{
                background: 'rgba(15, 23, 42, 0.4)',
                borderColor: 'rgba(99, 102, 241, 0.3)',
                padding: '16px 0',
                borderRadius: 8
              }}
            >
              {uploadingZip ? (
                <div>
                  <Spin size="small" />
                  <p style={{ color: '#94a3b8', marginTop: 8, fontSize: 12 }}>Đang tải file & tạo SHA256 checksum...</p>
                </div>
              ) : (
                <div>
                  <p className="ant-upload-drag-icon">
                    <FileZipOutlined style={{ color: '#6366f1', fontSize: 30 }} />
                  </p>
                  <p style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>
                    Kéo thả file .zip hoặc nhấp để chọn
                  </p>
                  <p style={{ color: '#64748b', fontSize: 12 }}>
                    Hệ thống sẽ tự động băm mã SHA-256 Checksum
                  </p>
                </div>
              )}
            </Upload.Dragger>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.file_path !== curr.file_path}>
            {() => {
              const filePath = uploadForm.getFieldValue('file_path');
              const fileHash = uploadForm.getFieldValue('file_hash');
              if (!filePath) return null;
              return (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: 6,
                  padding: '8px 12px',
                  marginBottom: 14
                }}>
                  <div style={{ color: '#34d399', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircleOutlined /> Đã sẵn sàng nộp bản build!
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, wordBreak: 'break-all', fontFamily: 'monospace' }}>
                    SHA256: {fileHash}
                  </div>
                </div>
              );
            }}
          </Form.Item>

          <Form.Item name="file_path" hidden><Input /></Form.Item>
          <Form.Item name="file_hash" hidden><Input /></Form.Item>
          <Form.Item name="file_size" hidden><Input /></Form.Item>

          <Form.Item
            name="changelog"
            label={<span style={{ color: '#cbd5e1', fontSize: 13 }}>Nội dung thay đổi (Changelog)</span>}
          >
            <Input.TextArea
              autoSize={{ minRows: 2, maxRows: 5 }}
              placeholder="ví dụ: Sửa lỗi giỏ hàng, cập nhật giao diện mới..."
              style={{ background: 'rgba(15, 23, 42, 0.6)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 13 }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 18, marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={submittingBuild}
              style={{
                height: 38,
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13
              }}
            >
              Nộp bản build (Chờ duyệt)
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 5. DRAWER: Builds History & Approval */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BranchesOutlined style={{ color: '#6366f1' }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Lịch sử bản build & Phê duyệt: {currentAppBuilds?.name}</span>
          </div>
        }
        extra={
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => handleOpenUploadBuild(currentAppBuilds)}
            style={{
              height: 30,
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 12
            }}
          >
            Nộp build mới
          </Button>
        }
        open={isBuildsDrawerOpen}
        onClose={() => setIsBuildsDrawerOpen(false)}
        width={720}
        destroyOnClose
        styles={{
          body: { background: '#0f172a' },
          header: { background: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.08)' }
        }}
      >
        <div style={{ marginBottom: 14 }}>
          <Text style={{ color: '#94a3b8', fontSize: 13 }}>
            Danh sách các bản build đã nộp. Bản build được duyệt sẽ tự động kích hoạt thành phiên bản chính thức.
          </Text>
        </div>

        <Table
          dataSource={buildsList}
          rowKey="id"
          loading={loadingBuilds}
          pagination={false}
          locale={{ emptyText: 'Chưa có bản build nào' }}
          columns={[
            {
              title: 'Phiên bản',
              key: 'version',
              width: 130,
              render: (_, record) => (
                <div>
                  <Tag color="purple" style={{ fontWeight: 600, fontSize: 12, borderRadius: 6 }}>
                    v{record.version}
                  </Tag>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    Build #{record.build_number}
                  </div>
                </div>
              )
            },
            {
              title: 'Thông tin File & Hash',
              key: 'file_info',
              render: (_, record) => (
                <div>
                  <a
                    href={record.file_path}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 12, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                  >
                    <FileZipOutlined /> Tải bundle zip
                  </a>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Tooltip title={record.file_hash}>
                      <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
                        SHA256: {record.file_hash?.substring(0, 16)}...
                      </span>
                    </Tooltip>
                    <Tooltip title="Sao chép SHA-256">
                      <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined style={{ fontSize: 12, color: '#94a3b8' }} />}
                        onClick={() => copyToClipboard(record.file_hash, 'Mã SHA-256')}
                        style={{ width: 18, height: 18, minWidth: 18, padding: 0 }}
                      />
                    </Tooltip>
                  </div>
                  {record.changelog && (
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, fontStyle: 'italic' }}>
                      "{record.changelog}"
                    </div>
                  )}
                </div>
              )
            },
            {
              title: 'Trạng thái',
              key: 'status',
              width: 130,
              render: (_, record) => {
                if (record.status === 2) {
                  return <Tag color="success" icon={<CheckCircleOutlined />} style={{ borderRadius: 6, fontSize: 12 }}>Đã duyệt</Tag>;
                }
                if (record.status === 3) {
                  return <Tag color="error" icon={<CloseCircleOutlined />} style={{ borderRadius: 6, fontSize: 12 }}>Từ chối</Tag>;
                }
                return <Tag color="warning" icon={<ClockCircleOutlined />} style={{ borderRadius: 6, fontSize: 12 }}>Chờ duyệt</Tag>;
              }
            },
            {
              title: 'Phê duyệt',
              key: 'approval',
              width: 160,
              render: (_, record) => (
                <Space size="small">
                  {record.status !== 2 && (
                    <Popconfirm
                      title="Duyệt bản build này?"
                      description="Bản build này sẽ được kích hoạt làm bản chính thức của Mini App."
                      onConfirm={() => handleUpdateBuildStatus(record.id, 2)}
                      okText="Duyệt ngay"
                      cancelText="Hủy"
                    >
                      <Button
                        type="primary"
                        size="small"
                        style={{
                          height: 30,
                          borderRadius: 6,
                          background: '#10b981',
                          borderColor: '#10b981',
                          fontSize: 12,
                          fontWeight: 600
                        }}
                      >
                        Duyệt
                      </Button>
                    </Popconfirm>
                  )}

                  {record.status !== 3 && record.status !== 2 && (
                    <Popconfirm
                      title="Từ chối bản build này?"
                      onConfirm={() => handleUpdateBuildStatus(record.id, 3)}
                      okText="Từ chối"
                      cancelText="Hủy"
                    >
                      <Button
                        danger
                        size="small"
                        style={{ height: 30, borderRadius: 6, fontSize: 12 }}
                      >
                        Từ chối
                      </Button>
                    </Popconfirm>
                  )}
                </Space>
              )
            }
          ]}
        />
      </Drawer>
    </div>
  );
}
