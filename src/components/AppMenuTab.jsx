import React, { useState, useEffect } from 'react';
import { 
  Table, Card, Button, Form, Input, InputNumber, Select, Switch, 
  Space, Tag, Popconfirm, Upload, message, Typography, Divider, Row, Col, Badge,
  Segmented, Modal
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, 
  ReloadOutlined, InfoCircleOutlined, ArrowLeftOutlined,
  SettingOutlined, BgColorsOutlined, LinkOutlined, LockOutlined,
  HolderOutlined, MobileOutlined, EyeOutlined
} from '@ant-design/icons';
import { api } from '../services/api';
import { useNavigate, useParams } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

const safeColor = (color, fallback) => {
  if (!color) return fallback;
  const trimmed = color.trim();
  if (!trimmed.startsWith('#')) return trimmed;
  
  const hexBody = trimmed.substring(1);
  if (hexBody.length === 5) {
    return '#' + hexBody + hexBody.charAt(4);
  }
  const reg = /^#([0-9A-F]{3}|[0-9A-F]{4}|[0-9A-F]{6}|[0-9A-F]{8})$/i;
  if (reg.test(trimmed)) {
    return trimmed;
  }
  return fallback;
};

const PERMISSIONS_LIST = [
  { value: 'camera', label: 'Camera' },
  { value: 'location', label: 'Vị trí (Location)' },
  { value: 'storage', label: 'Lưu trữ (Storage)' },
  { value: 'microphone', label: 'Microphone' },
  { value: 'push_notification', label: 'Thông báo đẩy' }
];

export default function AppMenuTab({ currentUser, forceFormView = false }) {
  const [menus, setMenus] = useState([]);
  const [treeMenus, setTreeMenus] = useState([]);
  const [miniApps, setMiniApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  
  // Track selected values for live previews
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [bgColor, setBgColor] = useState('');
  const [brdColor, setBrdColor] = useState('');
  const [txtColor, setTxtColor] = useState('');
  const [txtColorActive, setTxtColorActive] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [iconActiveUrl, setIconActiveUrl] = useState('');

  const [filterAppId, setFilterAppId] = useState('ALL');
  const [hoveredRowId, setHoveredRowId] = useState(null);
  
  // Custom grouping & mobile preview state
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' or 'tree'
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewAppId, setPreviewAppId] = useState(null);
  const [activeTabId, setActiveTabId] = useState(null);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = forceFormView && !!id;

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const resFlat = await api.get('/app-menus');
      setMenus(resFlat.data || []);
      
      const resTree = await api.get('/app-menus?tree=true');
      buildFilteredTree(resTree.data || [], filterAppId);
    } catch (err) {
      message.error('Không thể tải danh sách menu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMiniApps = async () => {
    try {
      const res = await api.get('/mini-apps?include_hidden=true&include_inactive=true');
      setMiniApps(res.data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách Mini Apps:', err);
    }
  };

  const fetchMenuDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/app-menus/${id}`);
      const record = res.data;
      form.setFieldsValue({
        mnu_name: record.mnu_name,
        mnu_image: record.mnu_image,
        mnu_image_actived: record.mnu_image_actived,
        mnu_bg_color: record.mnu_bg_color,
        mnu_brd_color: record.mnu_brd_color,
        mnu_txt_color: record.mnu_txt_color,
        mnu_txt_color_actived: record.mnu_txt_color_actived,
        mnu_order: record.mnu_order,
        mnu_position: record.mnu_position,
        menupid: record.menupid,
        app_id: record.app_id,
        requires_auth: record.requires_auth,
        url: record.url,
        is_hidden: record.is_hidden
      });
      setSelectedAppId(record.app_id);
      setBgColor(record.mnu_bg_color || '');
      setBrdColor(record.mnu_brd_color || '');
      setTxtColor(record.mnu_txt_color || '');
      setTxtColorActive(record.mnu_txt_color_actived || '');
      setIconUrl(record.mnu_image || '');
      setIconActiveUrl(record.mnu_image_actived || '');
    } catch (err) {
      message.error('Không thể tải chi tiết menu: ' + err.message);
      navigate('/app-menus');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (forceFormView) {
      fetchMiniApps();
      api.get('/app-menus').then(res => setMenus(res.data || [])).catch(console.error);
      if (isEditing) {
        fetchMenuDetails();
      } else {
        form.resetFields();
        form.setFieldsValue({
          mnu_order: 0,
          mnu_position: 'SIDEBAR',
          requires_auth: false,
        });
        setSelectedAppId(null);
        setBgColor('');
        setBrdColor('');
        setTxtColor('');
        setTxtColorActive('');
        setIconUrl('');
        setIconActiveUrl('');
      }
    } else {
      fetchMenus();
      fetchMiniApps();
    }
  }, [forceFormView, id, filterAppId]);

  // Tree filter logic
  const buildFilteredTree = (treeData, selectedApp) => {
    const mapTree = (items) => {
      return items
        .filter(item => {
          if (selectedApp === 'ALL') return true;
          if (selectedApp === 'NONE') return !item.app_id;
          
          const matchesSelf = item.app_id === selectedApp;
          const matchesChild = item.submenus && item.submenus.some(sub => sub.app_id === selectedApp);
          return matchesSelf || matchesChild;
        })
        .map(item => ({
          ...item,
          key: item.id,
          children: item.submenus && item.submenus.length > 0 ? mapTree(item.submenus) : undefined
        }));
    };
    setTreeMenus(mapTree(treeData));
  };
  
  const openPreview = (appId) => {
    setPreviewAppId(appId);
    setPreviewVisible(true);
    const targetAppId = appId === 'unlinked' ? null : appId;
    const appMenus = menus.filter(m => {
      const mAppId = m.app_id || null;
      return mAppId === targetAppId && m.mnu_position === 'BOTTOM_NAV';
    });
    const sorted = [...appMenus].sort((a, b) => (a.mnu_order || 0) - (b.mnu_order || 0));
    if (sorted.length > 0) {
      setActiveTabId(sorted[0].id);
    } else {
      setActiveTabId(null);
    }
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const values = await form.validateFields();
      
      // Ensure null instead of empty strings
      if (values.app_id === '') values.app_id = null;
      if (values.menupid === '') values.menupid = null;

      // Automatically determine menu_type based on url entry
      if (!values.url || values.url.trim() === '') {
        values.url = null;
        values.menu_type = 1; // 1: Native
      } else {
        values.menu_type = 0; // 0: Webview
      }

      if (isEditing) {
        await api.put(`/app-menus/${id}`, values);
        message.success('Cập nhật menu thành công');
      } else {
        await api.post('/app-menus', values);
        message.success('Thêm menu mới thành công');
      }
      navigate('/app-menus');
    } catch (err) {
      message.error('Lỗi khi lưu menu: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (menuId) => {
    try {
      await api.delete(`/app-menus/${menuId}`);
      message.success('Đã xóa menu thành công');
      fetchMenus();
    } catch (err) {
      message.error('Lỗi khi xóa menu: ' + err.message);
    }
  };

  const handleUploadImage = async (file, fieldName) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      message.loading({ content: 'Đang tải ảnh lên...', key: 'uploadImage' });
      const res = await api.post('/app-menus/upload-image', formData);
      message.success({ content: 'Tải ảnh lên thành công!', key: 'uploadImage' });
      form.setFieldsValue({ [fieldName]: res.data.url });
      if (fieldName === 'mnu_image') setIconUrl(res.data.url);
      if (fieldName === 'mnu_image_actived') setIconActiveUrl(res.data.url);
    } catch (err) {
      message.error({ content: 'Tải ảnh lên thất bại: ' + err.message, key: 'uploadImage' });
    }
    return false; // Prevent auto-upload by AntD Upload component
  };

  const columns = [
    {
      title: '',
      key: 'drag_handle',
      width: 40,
      align: 'center',
      render: () => <HolderOutlined style={{ cursor: 'grab', color: '#64748b', fontSize: '15px' }} />
    },
    {
      title: 'Tên Menu',
      dataIndex: 'mnu_name',
      key: 'mnu_name',
      render: (text, record) => (
        <span style={{ fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {record.mnu_image && (
            <img 
              src={record.mnu_image} 
              alt={text} 
              style={{ width: 22, height: 22, borderRadius: 5, objectFit: 'contain' }} 
            />
          )}
          {text}
        </span>
      )
    },
    {
      title: 'Vị trí',
      dataIndex: 'mnu_position',
      key: 'mnu_position',
      render: (pos) => <Tag color="blue">{pos}</Tag>
    },
    {
      title: 'Loại',
      dataIndex: 'menu_type',
      key: 'menu_type',
      render: (type) => type === 1 ? <Tag color="orange">Native</Tag> : <Tag color="purple">Webview</Tag>
    },
    {
      title: 'Mini App liên kết',
      dataIndex: 'app_id',
      key: 'app_id',
      render: (appId) => appId ? <Text code style={{ color: '#818cf8', background: 'rgba(129,140,248,0.1)' }}>{appId}</Text> : <Text type="secondary">-</Text>
    },
    {
      title: 'Đường dẫn/Link',
      dataIndex: 'url',
      key: 'url',
      render: (url) => url ? <Text copyable ellipsis={{ tooltip: url }} style={{ color: '#cbd5e1', maxWidth: 150 }}>{url}</Text> : <Text type="secondary">-</Text>
    },
    {
      title: 'Ẩn góc phải (..., X)',
      dataIndex: 'is_hidden',
      key: 'is_hidden',
      render: (hidden) => hidden ? (
        <Badge status="error" text={<span style={{ color: '#f87171' }}>Ẩn</span>} />
      ) : (
        <Badge status="success" text={<span style={{ color: '#4ade80' }}>Hiện</span>} />
      )
    },
    {
      title: 'Thứ tự',
      dataIndex: 'mnu_order',
      key: 'mnu_order',
      width: 80,
      sorter: (a, b) => a.mnu_order - b.mnu_order
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined style={{ color: '#6366f1' }} />} 
            onClick={() => navigate(`/app-menus/${record.id}/edit`)} 
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa menu này?"
            description="Tất cả các menu con trực thuộc cũng sẽ bị xóa."
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button 
              type="text"
              danger 
              icon={<DeleteOutlined style={{ color: '#ef4444' }} />} 
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const columnsGrouped = [
    {
      title: 'Tên Menu',
      dataIndex: 'mnu_name',
      key: 'mnu_name',
      render: (text, record) => (
        <span style={{ fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {record.mnu_image && (
            <img 
              src={record.mnu_image} 
              alt={text} 
              style={{ width: 22, height: 22, borderRadius: 5, objectFit: 'contain' }} 
            />
          )}
          {text}
        </span>
      )
    },
    {
      title: 'Vị trí',
      dataIndex: 'mnu_position',
      key: 'mnu_position',
      render: (pos) => (
        <Tag color={pos === 'BOTTOM_NAV' ? 'cyan' : 'blue'}>{pos}</Tag>
      )
    },
    {
      title: 'Loại',
      dataIndex: 'menu_type',
      key: 'menu_type',
      render: (type) => type === 1 ? <Tag color="orange">Native</Tag> : <Tag color="purple">Webview</Tag>
    },
    {
      title: 'Đường dẫn/Link',
      dataIndex: 'url',
      key: 'url',
      render: (url) => url ? <Text copyable ellipsis={{ tooltip: url }} style={{ color: '#cbd5e1', maxWidth: 150 }}>{url}</Text> : <Text type="secondary">-</Text>
    },
    {
      title: 'Ẩn góc phải (..., X)',
      dataIndex: 'is_hidden',
      key: 'is_hidden',
      render: (hidden) => hidden ? (
        <Badge status="error" text={<span style={{ color: '#f87171' }}>Ẩn</span>} />
      ) : (
        <Badge status="success" text={<span style={{ color: '#4ade80' }}>Hiện</span>} />
      )
    },
    {
      title: 'Thứ tự',
      dataIndex: 'mnu_order',
      key: 'mnu_order',
      width: 80,
      sorter: (a, b) => a.mnu_order - b.mnu_order
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined style={{ color: '#6366f1' }} />} 
            onClick={() => navigate(`/app-menus/${record.id}/edit`)} 
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa menu này?"
            description="Tất cả các menu con trực thuộc cũng sẽ bị xóa."
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button 
              type="text"
              danger 
              icon={<DeleteOutlined style={{ color: '#ef4444' }} />} 
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const getGroupedData = () => {
    const grouped = {};
    menus.forEach(menu => {
      const appId = menu.app_id || 'unlinked';
      if (!grouped[appId]) {
        grouped[appId] = [];
      }
      grouped[appId].push(menu);
    });

    const result = [];
    miniApps.forEach(app => {
      if (filterAppId !== 'ALL' && filterAppId !== app.app_id) return;
      if (grouped[app.app_id]) {
        result.push({
          key: app.app_id,
          app_id: app.app_id,
          name: app.name,
          icon_url: app.icon_url,
          menus: grouped[app.app_id].sort((a, b) => (a.mnu_order || 0) - (b.mnu_order || 0))
        });
      }
    });

    if (filterAppId === 'ALL' || filterAppId === 'NONE') {
      if (grouped['unlinked'] && grouped['unlinked'].length > 0) {
        result.push({
          key: 'unlinked',
          app_id: 'unlinked',
          name: 'Không liên kết Mini App (Chung / Portal / Ngoài)',
          icon_url: null,
          menus: grouped['unlinked'].sort((a, b) => (a.mnu_order || 0) - (b.mnu_order || 0))
        });
      }
    }

    return result;
  };

  if (forceFormView) {
    return (
      <div style={{ padding: '0', width: '100%', margin: '0 auto' }}>
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/app-menus')}
                style={{ color: '#94a3b8', padding: '0 8px' }}
              />
              <span style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>
                {isEditing ? 'Chỉnh sửa Cấu hình Menu' : 'Phát hành cấu hình Menu mới'}
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
            style={{ padding: '8px 16px' }}
            requiredMark={false}
            onFinish={handleSave}
            onValuesChange={(changedValues) => {
              if (changedValues.app_id !== undefined) {
                setSelectedAppId(changedValues.app_id);
              }
              if (changedValues.mnu_bg_color !== undefined) setBgColor(changedValues.mnu_bg_color);
              if (changedValues.mnu_brd_color !== undefined) setBrdColor(changedValues.mnu_brd_color);
              if (changedValues.mnu_txt_color !== undefined) setTxtColor(changedValues.mnu_txt_color);
              if (changedValues.mnu_txt_color_actived !== undefined) setTxtColorActive(changedValues.mnu_txt_color_actived);
              if (changedValues.mnu_image !== undefined) setIconUrl(changedValues.mnu_image);
              if (changedValues.mnu_image_actived !== undefined) setIconActiveUrl(changedValues.mnu_image_actived);
            }}
          >
            <Row gutter={24}>
              {/* Left Column: Basic configuration */}
              <Col xs={24} lg={12}>
                <div style={{ background: 'rgba(15, 23, 42, 0.3)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '20px' }}>
                  <Title level={5} style={{ color: '#a5b4fc', fontSize: '14px', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <SettingOutlined /> Thông tin cơ bản
                  </Title>
                  
                  <Form.Item 
                    name="mnu_name" 
                    label={<span style={{ color: '#cbd5e1', fontWeight: 500 }}>Tên Menu (Hiển thị)</span>} 
                    rules={[{ required: true, message: 'Vui lòng nhập tên menu' }]}
                  >
                    <Input 
                      placeholder="Ví dụ: Đặt Phòng, Tin tức..." 
                      style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item 
                        name="mnu_position" 
                        label={<span style={{ color: '#cbd5e1', fontWeight: 500 }}>Vị trí hiển thị</span>} 
                        rules={[{ required: true }]}
                      >
                        <Select 
                          placeholder="Chọn vị trí"
                          style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px' }}
                        >
                          <Select.Option value="SIDEBAR">SIDEBAR (Menu trái)</Select.Option>
                          <Select.Option value="BOTTOM_NAV">BOTTOM_NAV (Thanh điều hướng dưới)</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="mnu_order" label={<span style={{ color: '#cbd5e1', fontWeight: 500 }}>Thứ tự hiển thị</span>}>
                        <InputNumber min={0} style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item name="menupid" label={<span style={{ color: '#cbd5e1', fontWeight: 500 }}>Menu Cha (Nếu là menu con)</span>}>
                    <Select 
                      allowClear 
                      placeholder="Không có (Menu gốc)"
                      style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px' }}
                    >
                      {menus
                        .filter(m => !isEditing || m.id !== parseInt(id))
                        .map(m => (
                          <Select.Option key={m.id} value={m.id}>
                            {m.mnu_name} ({m.mnu_position})
                          </Select.Option>
                        ))}
                    </Select>
                  </Form.Item>

                  <Form.Item name="app_id" label={<span style={{ color: '#cbd5e1', fontWeight: 500 }}>Liên kết Mini App</span>}>
                    <Select 
                      allowClear 
                      placeholder="Chọn Mini App liên kết (Không bắt buộc)"
                      style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px' }}
                    >
                      {miniApps.map(app => (
                        <Select.Option key={app.id} value={app.app_id}>
                          {app.name} ({app.app_id})
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.3)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <Title level={5} style={{ color: '#a5b4fc', fontSize: '14px', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LinkOutlined /> Đường dẫn & Tương thích
                  </Title>

                  <Form.Item 
                    name="url" 
                    label={<span style={{ color: '#cbd5e1', fontWeight: 500 }}>Đường dẫn (URL / Router sub-route)</span>}
                  >
                    <Input 
                      placeholder={selectedAppId ? "Ví dụ: /my-rooms, /home (Tự động nối vào URL Mini App)" : "Ví dụ: https://google.com, /home"} 
                      style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} 
                    />
                  </Form.Item>
                  <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '-8px', marginBottom: '16px', lineHeight: '1.5' }}>
                    💡 {selectedAppId ? `Menu liên kết với Mini App ${selectedAppId}: Nhập router con (ví dụ: /rooms). Chúng tôi sẽ tự ghép nối vào URL gốc.` : 'Nhập URL đầy đủ nếu không liên kết Mini App.'}
                    <br />
                    📝 <em>Để trống = Native (menu_type=1) | Có nhập = Webview (menu_type=0)</em>
                  </div>


                </div>
              </Col>

              {/* Right Column: Style & Permissions */}
              <Col xs={24} lg={12}>
                <div style={{ background: 'rgba(15, 23, 42, 0.3)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '20px' }}>
                  <Title level={5} style={{ color: '#a5b4fc', fontSize: '14px', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BgColorsOutlined /> Giao diện & Màu sắc
                  </Title>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="mnu_image" label={<span style={{ color: '#cbd5e1', fontWeight: 500 }}>Ảnh biểu tượng (Icon URL)</span>}>
                        <Space.Compact style={{ width: '100%' }}>
                          <Input 
                            value={iconUrl}
                            onChange={(e) => setIconUrl(e.target.value)}
                            placeholder="https://..." 
                            style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                          />
                          <Upload 
                            accept="image/*" 
                            showUploadList={false} 
                            beforeUpload={(file) => handleUploadImage(file, 'mnu_image')}
                          >
                            <Button icon={<UploadOutlined />} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none' }} />
                          </Upload>
                        </Space.Compact>
                      </Form.Item>
                      {iconUrl && (
                        <div style={{ marginTop: -8, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>Xem trước:</span>
                          <img src={iconUrl} alt="Icon preview" style={{ width: 22, height: 22, borderRadius: 4, background: '#1e293b', padding: 2, objectFit: 'contain' }} />
                        </div>
                      )}
                    </Col>
                    
                    <Col span={12}>
                      <Form.Item name="mnu_image_actived" label={<span style={{ color: '#cbd5e1', fontWeight: 500 }}>Ảnh khi kích hoạt (Active Icon URL)</span>}>
                        <Space.Compact style={{ width: '100%' }}>
                          <Input 
                            value={iconActiveUrl}
                            onChange={(e) => setIconActiveUrl(e.target.value)}
                            placeholder="https://..." 
                            style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                          />
                          <Upload 
                            accept="image/*" 
                            showUploadList={false} 
                            beforeUpload={(file) => handleUploadImage(file, 'mnu_image_actived')}
                          >
                            <Button icon={<UploadOutlined />} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none' }} />
                          </Upload>
                        </Space.Compact>
                      </Form.Item>
                      {iconActiveUrl && (
                        <div style={{ marginTop: -8, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>Xem trước:</span>
                          <img src={iconActiveUrl} alt="Active Icon preview" style={{ width: 22, height: 22, borderRadius: 4, background: '#1e293b', padding: 2, objectFit: 'contain' }} />
                        </div>
                      )}
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="mnu_bg_color" label={<span style={{ color: '#cbd5e1', fontWeight: 500 }}>Màu Nền</span>}>
                        <Input 
                          placeholder="#edf7ee" 
                          suffix={bgColor && <span style={{ width: 14, height: 14, borderRadius: '50%', background: bgColor, display: 'inline-block', border: '1px solid rgba(255,255,255,0.2)' }} />}
                          style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} 
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="mnu_brd_color" label={<span style={{ color: '#cbd5e1', fontWeight: 500 }}>Màu Viền</span>}>
                        <Input 
                          placeholder="#e4f2e6" 
                          suffix={brdColor && <span style={{ width: 14, height: 14, borderRadius: '50%', background: brdColor, display: 'inline-block', border: '1px solid rgba(255,255,255,0.2)' }} />}
                          style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} 
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="mnu_txt_color" label={<span style={{ color: '#cbd5e1', fontWeight: 500 }}>Màu Chữ</span>}>
                        <Input 
                          placeholder="#5cb561" 
                          suffix={txtColor && <span style={{ width: 14, height: 14, borderRadius: '50%', background: txtColor, display: 'inline-block', border: '1px solid rgba(255,255,255,0.2)' }} />}
                          style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} 
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="mnu_txt_color_actived" label={<span style={{ color: '#cbd5e1', fontWeight: 500 }}>Màu Chữ Active</span>}>
                        <Input 
                          placeholder="#000000" 
                          suffix={txtColorActive && <span style={{ width: 14, height: 14, borderRadius: '50%', background: txtColorActive, display: 'inline-block', border: '1px solid rgba(255,255,255,0.2)' }} />}
                          style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} 
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.3)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <Title level={5} style={{ color: '#a5b4fc', fontSize: '14px', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LockOutlined /> Quyền & Hiển Thị
                  </Title>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="requires_auth" label={<span style={{ color: '#cbd5e1', fontWeight: 500 }}>Yêu cầu đăng nhập</span>} valuePropName="checked">
                        <Switch checkedChildren="Có" unCheckedChildren="Không" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="is_hidden" label={<span style={{ color: '#cbd5e1', fontWeight: 500 }}>Ẩn nút tiêu đề (..., x)</span>} valuePropName="checked">
                        <Switch checkedChildren="Ẩn" unCheckedChildren="Hiện" />
                      </Form.Item>
                    </Col>
                  </Row>


                </div>
              </Col>
            </Row>

            <Form.Item style={{ marginBottom: 0, marginTop: '32px', textAlign: 'right', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
              <Space>
                <Button onClick={() => navigate('/app-menus')} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', height: 38, borderRadius: 5 }}>
                  Hủy bỏ
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none', height: 38, borderRadius: 5, fontWeight: 600 }}
                >
                  {isEditing ? 'Lưu thay đổi' : 'Phát hành Menu'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </div>
    );
  }

  const previewApp = previewAppId === 'unlinked' ? null : miniApps.find(a => a.app_id === previewAppId);
  const previewMenus = menus.filter(m => {
    const mAppId = m.app_id || null;
    const targetAppId = previewAppId === 'unlinked' ? null : previewAppId;
    return mAppId === targetAppId && m.mnu_position === 'BOTTOM_NAV';
  }).sort((a, b) => (a.mnu_order || 0) - (b.mnu_order || 0));

  const activeTab = previewMenus.find(m => m.id === activeTabId);

  const filteredMenus = menus.filter(item => {
    if (filterAppId === 'ALL') return true;
    if (filterAppId === 'NONE') return !item.app_id;
    return item.app_id === filterAppId;
  }).sort((a, b) => (a.mnu_order || 0) - (b.mnu_order || 0));

  return (
    <div>
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>Quản lý Menu Portal</span>
          </div>
        }
        extra={
          <Space size="middle">
            <Text style={{ color: '#94a3b8' }}>Lọc theo Mini App:</Text>
            <Select 
              value={filterAppId} 
              onChange={setFilterAppId}
              style={{ width: 220, background: 'rgba(15, 23, 42, 0.4)', borderRadius: 5 }}
              dropdownStyle={{ background: '#1e293b' }}
            >
              <Select.Option value="ALL">Tất cả Mini Apps</Select.Option>
              <Select.Option value="NONE">Không liên kết Mini App</Select.Option>
              {miniApps.map(app => (
                <Select.Option key={app.id} value={app.app_id}>
                  {app.name} ({app.app_id})
                </Select.Option>
              ))}
            </Select>
 
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => navigate('/app-menus/new')}
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                border: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}
            >
              Thêm Menu
            </Button>
 
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={fetchMenus}
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
          dataSource={filteredMenus.map(m => ({ ...m, key: m.id }))} 
          loading={loading}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          locale={{ emptyText: <span style={{ color: '#94a3b8' }}>Chưa có cấu hình menu nào.</span> }}
          style={{ background: 'transparent' }}
          className="custom-table"
          size="small"
          onRow={(record) => ({
            draggable: true,
            style: { 
              cursor: 'grab', 
              background: record.id === hoveredRowId ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
              transition: 'background 0.2s ease'
            },
            onDragStart: (e) => {
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', record.id);
              window.draggedRecord = record;
            },
            onDragEnter: (e) => {
              e.preventDefault();
              if (window.draggedRecord && window.draggedRecord.id !== record.id) {
                setHoveredRowId(record.id);
              }
            },
            onDragOver: (e) => {
              e.preventDefault();
            },
            onDragLeave: () => {
              setHoveredRowId(null);
            },
            onDrop: async (e) => {
              e.preventDefault();
              setHoveredRowId(null);
              const dragRecord = window.draggedRecord;
              const hoverRecord = record;
              if (!dragRecord || dragRecord.id === hoverRecord.id) return;
              
              const siblings = [...menus];
              const dragIdx = siblings.findIndex(s => s.id === dragRecord.id);
              const hoverIdx = siblings.findIndex(s => s.id === hoverRecord.id);
              
              if (hoverIdx !== -1 && dragIdx !== -1) {
                siblings.splice(dragIdx, 1);
                siblings.splice(hoverIdx, 0, dragRecord);
                
                const orderUpdates = siblings.map((item, idx) => ({
                  id: item.id,
                  mnu_order: idx + 1
                }));
                
                try {
                  await api.put('/app-menus/order/bulk', { items: orderUpdates });
                  message.success('Sắp xếp thứ tự thành công!');
                  fetchMenus();
                } catch (err) {
                  message.error('Sắp xếp thất bại: ' + err.message);
                }
              }
            }
          })}
        />
      </Card>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
            <MobileOutlined />
            <span>Mô phỏng Galaxy S24 - {previewApp ? previewApp.name : 'Cấu hình Chung'}</span>
          </div>
        }
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setPreviewVisible(false)}>
            Đóng xem trước
          </Button>
        ]}
        width={400}
        centered
        styles={{
          body: {
            background: '#090d16',
            padding: '20px 0',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }
        }}
      >
        <div
          style={{
            width: '330px',
            height: '590px',
            borderRadius: '24px',
            border: '8px solid #27272a', // Titanium frame S24
            background: '#0b0f19',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7), inset 0 0 4px rgba(255,255,255,0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        >
          {/* S24 Punch Hole Camera */}
          <div
            style={{
              width: '12px',
              height: '12px',
              background: '#000',
              borderRadius: '50%',
              position: 'absolute',
              top: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
              boxShadow: '0 0 2px rgba(255,255,255,0.2)'
            }}
          />

          {/* Android Status Bar */}
          <div
            style={{
              height: '32px',
              padding: '8px 16px 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '11px',
              fontWeight: '500',
              color: '#cbd5e1',
              zIndex: 5,
              background: 'transparent'
            }}
          >
            <span>09:41</span>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '10px' }}>📶</span>
              <span style={{ fontSize: '10px' }}>📶</span>
              <span style={{ fontSize: '10px' }}>🔋 100%</span>
            </div>
          </div>

          {/* Screen Content Area */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              background: 'linear-gradient(to bottom, #1e293b, #090d16)',
              position: 'relative'
            }}
          >
            {activeTab ? (
              <div style={{ width: '100%' }}>
                {previewApp && previewApp.icon_url && (
                  <img
                    src={previewApp.icon_url}
                    alt=""
                    style={{ 
                      width: 60, 
                      height: 60, 
                      borderRadius: 14, 
                      marginBottom: 12, 
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)', 
                      objectFit: 'contain',
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}
                  />
                )}
                <h3 style={{ color: '#fff', fontSize: '17px', fontWeight: '700', margin: '0 0 4px 0' }}>
                  {activeTab.mnu_name}
                </h3>
                <p style={{ color: '#818cf8', fontSize: '12px', margin: '0 0 16px 0', fontWeight: '500' }}>
                  {activeTab.menu_type === 1 ? 'Chức năng Hệ thống' : 'Trang Webview'}
                </p>

                {/* Inspect specs box */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '10px',
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '11px',
                    color: '#94a3b8'
                  }}
                >
                  <div style={{ color: '#a5b4fc', fontWeight: '600', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '4px' }}>
                    🔧 THÔNG TIN CẤU HÌNH MENU:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '6px' }}>
                    <span>Màu nền:</span>
                    <span style={{ color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {activeTab.mnu_bg_color || '(mặc định)'}
                      {activeTab.mnu_bg_color && (
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: safeColor(activeTab.mnu_bg_color, '#fff'), border: '1px solid rgba(255,255,255,0.2)', display: 'inline-block' }} />
                      )}
                    </span>
                    <span>Màu viền:</span>
                    <span style={{ color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {activeTab.mnu_brd_color || '(mặc định)'}
                      {activeTab.mnu_brd_color && (
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: safeColor(activeTab.mnu_brd_color, '#fff'), border: '1px solid rgba(255,255,255,0.2)', display: 'inline-block' }} />
                      )}
                    </span>
                    <span>Màu chữ:</span>
                    <span style={{ color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {activeTab.mnu_txt_color || '(mặc định)'}
                      {activeTab.mnu_txt_color && (
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: safeColor(activeTab.mnu_txt_color, '#94a3b8'), border: '1px solid rgba(255,255,255,0.2)', display: 'inline-block' }} />
                      )}
                    </span>
                    <span>Chữ Active:</span>
                    <span style={{ color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {activeTab.mnu_txt_color_actived || '(mặc định)'}
                      {activeTab.mnu_txt_color_actived && (
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: safeColor(activeTab.mnu_txt_color_actived, '#818cf8'), border: '1px solid rgba(255,255,255,0.2)', display: 'inline-block' }} />
                      )}
                    </span>
                    <span>Yêu cầu Auth:</span>
                    <span style={{ color: '#f8fafc' }}>{activeTab.requires_auth ? 'Có' : 'Không'}</span>
                    <span>Nút Tiêu đề:</span>
                    <span style={{ color: '#f8fafc' }}>{activeTab.is_hidden ? 'Ẩn' : 'Hiện'}</span>
                    {activeTab.url && (
                      <>
                        <span>Đường dẫn:</span>
                        <span style={{ wordBreak: 'break-all', color: '#a5b4fc' }}>{activeTab.url}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: '#64748b' }}>
                <EyeOutlined style={{ fontSize: '32px', marginBottom: '12px' }} />
                <div>Không có tab bottom nav nào đang hoạt động</div>
              </div>
            )}
          </div>

          {/* Bottom Navigation Mockup */}
          {previewMenus.length > 0 && (
            <div
              style={{
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                background: safeColor(previewMenus[0]?.mnu_bg_color, '#1e293b'),
                borderTop: `1px solid ${safeColor(previewMenus[0]?.mnu_brd_color, 'rgba(255, 255, 255, 0.08)')}`,
                zIndex: 5
              }}
            >
              {previewMenus.map(item => {
                const isActive = item.id === activeTabId;
                const icon = isActive ? (item.mnu_image_actived || item.mnu_image) : item.mnu_image;
                const textColor = isActive
                  ? safeColor(item.mnu_txt_color_actived, '#6366f1')
                  : safeColor(item.mnu_txt_color, '#94a3b8');

                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveTabId(item.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flex: 1,
                      height: '100%',
                      padding: '2px 0',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: isActive ? 'scale(1.06)' : 'scale(1)'
                    }}
                  >
                    {icon ? (
                      <img
                        src={icon}
                        alt=""
                        style={{
                          width: '22px',
                          height: '22px',
                          objectFit: 'contain',
                          marginBottom: '2px',
                          transition: 'transform 0.2s ease',
                          transform: isActive ? 'scale(1.1)' : 'scale(1)'
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: textColor,
                          opacity: isActive ? 1 : 0.4,
                          marginBottom: '4px'
                        }}
                      />
                    )}
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: isActive ? '600' : '500',
                        color: textColor,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '60px'
                      }}
                    >
                      {item.mnu_name}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Android Navigation Softkeys for Galaxy S24 */}
          <div
            style={{
              height: '32px',
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
              background: safeColor(previewMenus[0]?.mnu_bg_color, '#090d16'),
              padding: '0 40px 6px 40px',
              borderTop: '1px solid rgba(255,255,255,0.02)'
            }}
          >
            {/* Recents Button */}
            <div style={{ display: 'flex', gap: '3px', cursor: 'default' }}>
              <div style={{ width: '2px', height: '10px', background: 'rgba(255, 255, 255, 0.4)', borderRadius: '1px' }} />
              <div style={{ width: '2px', height: '10px', background: 'rgba(255, 255, 255, 0.4)', borderRadius: '1px' }} />
              <div style={{ width: '2px', height: '10px', background: 'rgba(255, 255, 255, 0.4)', borderRadius: '1px' }} />
            </div>

            {/* Home Button */}
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                cursor: 'default'
              }}
            />

            {/* Back Button */}
            <div style={{ cursor: 'default', color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <span>◀</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
