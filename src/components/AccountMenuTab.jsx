import React, { useState, useEffect } from 'react';
import { Button, Space, Modal, Form, Input, Card, Badge, Tooltip, message, Popconfirm, Row, Col, Select, Switch, InputNumber, List, Upload, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, PhoneOutlined, RightOutlined, HolderOutlined, EyeOutlined, UploadOutlined } from '@ant-design/icons';
import { api } from '../services/api';

const CATEGORY_LABELS = {
  "hb-vw-mn-ac-group-account": "TÀI KHOẢN",
  "hb-vw-mn-ac-group-support": "HỖ TRỢ"
};

const NAME_LABELS = {
  "hb-vw-mn-ac-personal-info": "Thông tin cá nhân",
  "hb-vw-mn-ac-change-password": "Đổi mật khẩu",
  "hb-vw-mn-ac-address-book": "Sổ địa chỉ",
  "hb-vw-mn-ac-notifications": "Thông báo",
  "hb-vw-mn-ac-help-center": "Trung tâm trợ giúp",
  "hb-vw-mn-ac-terms-and-policies": "Điều khoản & Chính sách",
  "hb-vw-mn-ac-language": "Ngôn ngữ"
};

const PERMISSIONS_LIST = [
  { value: 'camera', label: 'Camera' },
  { value: 'location', label: 'Vị trí (Location)' },
  { value: 'storage', label: 'Lưu trữ (Storage)' },
  { value: 'microphone', label: 'Microphone' },
  { value: 'push_notification', label: 'Thông báo đẩy' }
];

export default function AccountMenuTab({ currentUser }) {
  const [groupedMenus, setGroupedMenus] = useState([]);
  const [miniApps, setMiniApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [iconUrl, setIconUrl] = useState('');
  const [iconActiveUrl, setIconActiveUrl] = useState('');
  const [rightIconUrl, setRightIconUrl] = useState('');
  const [bgColor, setBgColor] = useState('');
  const [brdColor, setBrdColor] = useState('');
  const [txtColor, setTxtColor] = useState('');
  const [txtColorActive, setTxtColorActive] = useState('');

  const menuPerm = currentUser?.username === 'admin' ? 7 : 4;
  const canAdd = (menuPerm & 1) === 1;
  const canDelete = (menuPerm & 2) === 2;
  const canEdit = (menuPerm & 4) === 4;

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
      if (fieldName === 'right_icon') setRightIconUrl(res.data.url);
    } catch (err) {
      message.error({ content: 'Tải ảnh lên thất bại: ' + err.message, key: 'uploadImage' });
    }
    return false; // Prevent auto-upload by AntD Upload component
  };

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/account-menus?include_inactive=true');
      setGroupedMenus(res.data || []);
    } catch (err) {
      message.error('Không thể tải danh sách menu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMiniApps = async () => {
    try {
      const res = await api.get('/mini-apps?include_hidden=true&include_inactive=true');
      setMiniApps(res.data || res || []);
    } catch (err) {
      console.error('Không thể tải danh sách Mini Apps:', err);
    }
  };

  useEffect(() => {
    fetchMenus();
    fetchMiniApps();
  }, []);

  const handleCreateClick = () => {
    setEditingMenu(null);
    form.resetFields();
    form.setFieldsValue({ key: '', is_hidden: false, is_actived: true, requires_auth: false, mnu_order: 1, menu_type: 0, app_id: undefined });
    setIconUrl('');
    setIconActiveUrl('');
    setRightIconUrl('');
    setBgColor('');
    setBrdColor('');
    setTxtColor('');
    setTxtColorActive('');
    setIsModalOpen(true);
  };

  const handleEditClick = (menu) => {
    setEditingMenu(menu);
    form.setFieldsValue({
      key: menu.key,
      category: menu.category,
      mnu_name: menu.mnu_name,
      mnu_image: menu.mnu_image,
      mnu_image_actived: menu.mnu_image_actived,
      mnu_bg_color: menu.mnu_bg_color,
      mnu_brd_color: menu.mnu_brd_color,
      mnu_txt_color: menu.mnu_txt_color,
      mnu_txt_color_actived: menu.mnu_txt_color_actived,
      url: menu.url,
      menu_type: menu.menu_type !== undefined ? menu.menu_type : 0,
      right_icon: menu.right_icon,
      mnu_order: menu.mnu_order,
      requires_auth: menu.requires_auth,
      is_hidden: menu.is_hidden !== false,
      is_actived: menu.is_actived !== false,
      app_id: menu.app_id || undefined
    });
    setIconUrl(menu.mnu_image || '');
    setIconActiveUrl(menu.mnu_image_actived || '');
    setRightIconUrl(menu.right_icon || '');
    setBgColor(menu.mnu_bg_color || '');
    setBrdColor(menu.mnu_brd_color || '');
    setTxtColor(menu.mnu_txt_color || '');
    setTxtColorActive(menu.mnu_txt_color_actived || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/account-menus/${id}`);
      message.success('Xóa menu thành công!');
      fetchMenus();
    } catch (err) {
      message.error(err.message || 'Không thể xóa menu.');
    }
  };

  const handleModalSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        key: values.key,
        category: values.category,
        mnu_name: values.mnu_name,
        mnu_image: values.mnu_image,
        mnu_image_actived: values.mnu_image_actived || null,
        mnu_bg_color: values.mnu_bg_color || null,
        mnu_brd_color: values.mnu_brd_color || null,
        mnu_txt_color: values.mnu_txt_color || null,
        mnu_txt_color_actived: values.mnu_txt_color_actived || null,
        url: values.url,
        menu_type: parseInt(values.menu_type || 0),
        right_icon: values.right_icon || null,
        mnu_order: parseInt(values.mnu_order || 0),
        requires_auth: !!values.requires_auth,
        is_hidden: !!values.is_hidden,
        is_actived: !!values.is_actived,
        app_id: values.app_id || null
      };

      if (editingMenu) {
        await api.put(`/account-menus/${editingMenu.id}`, payload);
        message.success('Cập nhật menu thành công!');
      } else {
        await api.post('/account-menus', payload);
        message.success('Thêm menu mới thành công!');
      }
      setIsModalOpen(false);
      fetchMenus();
    } catch (err) {
      message.error(err.message || 'Lưu menu thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  // Drag & Drop Sorting Handlers
  const handleDragStart = (e, index, category) => {
    e.dataTransfer.setData('index', index);
    e.dataTransfer.setData('category', category);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetIndex, category) => {
    const sourceIndex = parseInt(e.dataTransfer.getData('index'));
    const sourceCategory = e.dataTransfer.getData('category');

    if (sourceCategory !== category) return; // Only allow sorting within same category
    if (sourceIndex === targetIndex) return;

    const updatedGrouped = [...groupedMenus];
    const group = updatedGrouped.find(g => g.category === category);
    if (!group) return;

    const reorderedItems = [...group.items];
    const [movedItem] = reorderedItems.splice(sourceIndex, 1);
    reorderedItems.splice(targetIndex, 0, movedItem);

    // Update order numbers sequentially
    const updatedItems = reorderedItems.map((item, idx) => ({
      ...item,
      mnu_order: idx + 1
    }));

    group.items = updatedItems;
    setGroupedMenus(updatedGrouped);

    try {
      const itemsToUpdate = updatedItems.map(item => ({ id: item.id, mnu_order: item.mnu_order }));
      await api.put('/account-menus/order/bulk', { items: itemsToUpdate });
      message.success('Đã cập nhật thứ tự menu!');
    } catch (err) {
      message.error('Lỗi khi cập nhật thứ tự: ' + err.message);
      fetchMenus();
    }
  };

  return (
    <div>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>Cấu hình Menu màn hình Cá nhân (Tài khoản)</span>
          </div>
        }
        extra={
          <Space>
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => setIsPreviewOpen(true)}
              style={{ background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)', color: '#a5b4fc', fontWeight: 600 }}
            >
              Xem trước Mobile
            </Button>
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
                Thêm Menu
              </Button>
            )}
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
          background: 'rgba(30, 41, 59, 0.4)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '5px',
        }}
      >
        <Row gutter={[16, 16]}>
          {Object.keys(CATEGORY_LABELS).map((catKey) => {
            const group = groupedMenus.find(g => g.category === catKey) || { category: catKey, items: [] };
            return (
              <Col xs={24} md={12} key={catKey}>
                <Card
                  title={<span style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: 'bold' }}>{CATEGORY_LABELS[catKey]}</span>}
                  bordered={false}
                  style={{ background: 'rgba(15, 23, 42, 0.3)', border: '1px solid rgba(255, 255, 255, 0.04)' }}
                  bodyStyle={{ padding: '8px' }}
                >
                  <div style={{ minHeight: '150px' }}>
                    {group.items.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#64748b', padding: '24px 0', fontSize: '12px' }}>
                        Kéo thả hoặc thêm menu vào đây
                      </div>
                    ) : (
                      group.items.map((item, idx) => (
                        <div
                          key={item.id}
                          draggable={canEdit}
                          onDragStart={(e) => handleDragStart(e, idx, catKey)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, idx, catKey)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: 'rgba(30, 41, 59, 0.6)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            padding: '8px 12px',
                            borderRadius: '5px',
                            marginBottom: '8px',
                            cursor: canEdit ? 'grab' : 'default',
                            transition: 'all 0.3s',
                            opacity: item.is_actived === false ? 0.55 : 1
                          }}
                          className="menu-drag-item"
                        >
                          {canEdit && <HolderOutlined style={{ color: '#64748b', cursor: 'grab' }} />}
                          {item.mnu_image ? (
                            <img src={item.mnu_image} alt={item.mnu_name} style={{ width: '20px', height: '20px', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
                          ) : null}
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '13px', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                              {NAME_LABELS[item.mnu_name] || item.mnu_name} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal', marginLeft: '6px' }}>({item.key})</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                              <span style={{ fontSize: '11px', color: '#34d399', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '70%' }}>{item.url}</span>
                              <span style={{ fontSize: '9px', color: item.menu_type === 1 ? '#fb923c' : '#a78bfa', background: item.menu_type === 1 ? 'rgba(251,146,60,0.1)' : 'rgba(167,139,250,0.1)', padding: '0 4px', borderRadius: '3px', whiteSpace: 'nowrap' }}>
                                {item.menu_type === 1 ? 'Native' : 'Webview'}
                              </span>
                              {item.is_actived === false && (
                                <span style={{ fontSize: '9px', color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '0 4px', borderRadius: '3px', whiteSpace: 'nowrap' }}>
                                  Tắt
                                </span>
                              )}
                            </div>
                          </div>

                          <Space size={4}>
                            {item.requires_auth && (
                              <Tooltip title="Yêu cầu đăng nhập">
                                <Badge status="warning" />
                              </Tooltip>
                            )}
                            <Button
                              type="text"
                              size="small"
                              disabled={!canEdit}
                              icon={<EditOutlined style={{ color: canEdit ? '#6366f1' : '#64748b', fontSize: '12px' }} />}
                              onClick={() => handleEditClick(item)}
                            />
                            <Popconfirm
                              title="Xóa menu này?"
                              onConfirm={() => handleDelete(item.id)}
                              okText="Xóa"
                              cancelText="Hủy"
                              disabled={!canDelete}
                            >
                              <Button
                                type="text"
                                size="small"
                                danger
                                disabled={!canDelete}
                                icon={<DeleteOutlined style={{ color: canDelete ? '#ef4444' : '#64748b', fontSize: '12px' }} />}
                              />
                            </Popconfirm>
                          </Space>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>

      {/* CRUD Modal */}
      <Modal
        title={
          <span style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>
            {editingMenu ? 'Chỉnh sửa Menu' : 'Thêm Menu mới'}
          </span>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
        width={720}
        style={{ top: 80 }}
        bodyStyle={{ padding: '10px 0' }}
        wrapClassName="dark-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleModalSubmit}
          requiredMark={false}
          onValuesChange={(changedValues) => {
            if (changedValues.mnu_image !== undefined) setIconUrl(changedValues.mnu_image);
            if (changedValues.mnu_image_actived !== undefined) setIconActiveUrl(changedValues.mnu_image_actived);
            if (changedValues.right_icon !== undefined) setRightIconUrl(changedValues.right_icon);
            if (changedValues.mnu_bg_color !== undefined) setBgColor(changedValues.mnu_bg_color);
            if (changedValues.mnu_brd_color !== undefined) setBrdColor(changedValues.mnu_brd_color);
            if (changedValues.mnu_txt_color !== undefined) setTxtColor(changedValues.mnu_txt_color);
            if (changedValues.mnu_txt_color_actived !== undefined) setTxtColorActive(changedValues.mnu_txt_color_actived);
          }}
        >
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item
                name="category"
                label={<span style={{ color: '#e2e8f0' }}>Nhóm danh mục</span>}
                rules={[{ required: true, message: 'Vui lòng chọn nhóm danh mục!' }]}
              >
                <Select style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff' }}>
                  {Object.keys(CATEGORY_LABELS).map(key => (
                    <Select.Option key={key} value={key}>{CATEGORY_LABELS[key]}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="mnu_name"
                label={<span style={{ color: '#e2e8f0' }}>Tên hiển thị</span>}
                rules={[{ required: true, message: 'Vui lòng nhập tên hiển thị!' }]}
              >
                <Input
                  placeholder="Ví dụ: Thông tin cá nhân"
                  style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="key"
                label={<span style={{ color: '#e2e8f0' }}>Mã định danh (Key)</span>}
                rules={[{ required: true, message: 'Vui lòng nhập mã định danh!' }]}
              >
                <Input
                  placeholder="Ví dụ: hb-vw-mn-ac-profile"
                  style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={24}>
              <Form.Item
                name="app_id"
                label={<span style={{ color: '#cbd5e1', fontWeight: 500 }}>Liên kết Mini App</span>}
                extra={<span style={{ color: '#64748b', fontSize: '11px' }}>Thừa hưởng phiên bản, file path, hash và checksum từ Mini App.</span>}
              >
                <Select placeholder="Chọn Mini App để liên kết..." style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff' }} dropdownStyle={{ background: '#1e293b' }} allowClear>
                  {miniApps.map(app => (
                    <Select.Option key={app.id} value={app.app_id}>
                      {app.name} ({app.app_id})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={16}>
              <Form.Item
                name="url"
                label={<span style={{ color: '#e2e8f0' }}>Đường dẫn chuyển trang / Deeplink</span>}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (value || getFieldValue('app_id')) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Vui lòng nhập đường dẫn chuyển trang hoặc liên kết Mini App!'));
                    },
                  }),
                ]}
              >
                <Input
                  placeholder="Ví dụ: /profile hoặc homebooking://..."
                  style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="menu_type"
                label={<span style={{ color: '#e2e8f0' }}>Loại Menu (Type)</span>}
                rules={[{ required: true, message: 'Vui lòng chọn loại menu!' }]}
              >
                <Select style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff' }}>
                  <Select.Option value={0}>Webview (0)</Select.Option>
                  <Select.Option value={1}>Native (1)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '12px 0 12px' }}>
            <span style={{ color: '#818cf8', fontSize: '12px', fontWeight: 600 }}>Cấu hình Icon & Hình ảnh</span>
          </Divider>

          <Row gutter={12}>
            <Col span={8}>
              <Form.Item
                name="mnu_image"
                label={<span style={{ color: '#e2e8f0' }}>Icon (Trái)</span>}
                rules={[{ required: true, message: 'Vui lòng nhập URL icon!' }]}
              >
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    placeholder="Icon thường"
                    style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={(file) => handleUploadImage(file, 'mnu_image')}
                  >
                    <Button icon={<UploadOutlined />} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', height: '36px' }} />
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

            <Col span={8}>
              <Form.Item
                name="mnu_image_actived"
                label={<span style={{ color: '#e2e8f0' }}>Active Icon</span>}
              >
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    placeholder="Icon khi chọn"
                    style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={(file) => handleUploadImage(file, 'mnu_image_actived')}
                  >
                    <Button icon={<UploadOutlined />} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', height: '36px' }} />
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

            <Col span={8}>
              <Form.Item
                name="right_icon"
                label={<span style={{ color: '#e2e8f0' }}>Icon (Phải - Tùy chọn)</span>}
              >
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    placeholder="Để trống dùng >"
                    style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={(file) => handleUploadImage(file, 'right_icon')}
                  >
                    <Button icon={<UploadOutlined />} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', height: '36px' }} />
                  </Upload>
                </Space.Compact>
              </Form.Item>
              {rightIconUrl && (
                <div style={{ marginTop: -8, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Xem trước:</span>
                  <img src={rightIconUrl} alt="Right Icon preview" style={{ width: 22, height: 22, borderRadius: 4, background: '#1e293b', padding: 2, objectFit: 'contain' }} />
                </div>
              )}
            </Col>
          </Row>

          <Divider orientation="left" style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '12px 0 12px' }}>
            <span style={{ color: '#818cf8', fontSize: '12px', fontWeight: 600 }}>Tùy chỉnh Giao diện (Styles)</span>
          </Divider>

          <Row gutter={12}>
            <Col span={6}>
              <Form.Item
                name="mnu_bg_color"
                label={<span style={{ color: '#cbd5e1', fontWeight: 500 }}>Màu nền</span>}
              >
                <Input
                  placeholder="Ví dụ: #edf7ee"
                  suffix={bgColor && <span style={{ width: 14, height: 14, borderRadius: '50%', background: bgColor, display: 'inline-block', border: '1px solid rgba(255,255,255,0.2)' }} />}
                  style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="mnu_brd_color"
                label={<span style={{ color: '#cbd5e1', fontWeight: 500 }}>Màu viền</span>}
              >
                <Input
                  placeholder="Ví dụ: #e4f2e6"
                  suffix={brdColor && <span style={{ width: 14, height: 14, borderRadius: '50%', background: brdColor, display: 'inline-block', border: '1px solid rgba(255,255,255,0.2)' }} />}
                  style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="mnu_txt_color"
                label={<span style={{ color: '#cbd5e1', fontWeight: 500 }}>Màu chữ</span>}
              >
                <Input
                  placeholder="Ví dụ: #5cb561"
                  suffix={txtColor && <span style={{ width: 14, height: 14, borderRadius: '50%', background: txtColor, display: 'inline-block', border: '1px solid rgba(255,255,255,0.2)' }} />}
                  style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="mnu_txt_color_actived"
                label={<span style={{ color: '#cbd5e1', fontWeight: 500 }}>Màu chữ active</span>}
              >
                <Input
                  placeholder="Ví dụ: #388e3c"
                  suffix={txtColorActive && <span style={{ width: 14, height: 14, borderRadius: '50%', background: txtColorActive, display: 'inline-block', border: '1px solid rgba(255,255,255,0.2)' }} />}
                  style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12} align="middle" style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 12px 0 12px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '8px' }}>
            <Col span={6}>
              <Form.Item
                name="mnu_order"
                label={<span style={{ color: '#e2e8f0' }}>Thứ tự sắp xếp</span>}
                rules={[{ required: true, message: 'Nhập số thứ tự!' }]}
              >
                <InputNumber
                  min={1}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </Form.Item>
            </Col>
            <Col span={6} style={{ textAlign: 'center' }}>
              <Form.Item
                name="requires_auth"
                label={<span style={{ color: '#e2e8f0' }}>Cần Login</span>}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6} style={{ textAlign: 'center' }}>
              <Form.Item
                name="is_actived"
                label={<span style={{ color: '#e2e8f0' }}>Hoạt động</span>}
                valuePropName="checked"
              >
                <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
              </Form.Item>
            </Col>
            <Col span={6} style={{ textAlign: 'center' }}>
              <Form.Item
                name="is_hidden"
                label={<span style={{ color: '#e2e8f0' }}>Ẩn đ.hướng Super App</span>}
                valuePropName="checked"
              >
                <Switch checkedChildren="Ẩn" unCheckedChildren="Hiện" />
              </Form.Item>
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
                {editingMenu ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Simulator Preview Modal */}
      <Modal
        title={null}
        open={isPreviewOpen}
        onCancel={() => setIsPreviewOpen(false)}
        footer={null}
        width={340}
        bodyStyle={{ display: 'flex', justifyContent: 'center', background: '#0f172a', padding: '16px 0', borderRadius: '8px' }}
        centered
        destroyOnClose
      >
        {/* Phone Screen Mockup */}
        <div style={{
          width: '290px',
          height: '420px',
          borderRadius: '16px',
          background: '#f1f5f9',
          border: '4px solid #334155',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          padding: '12px'
        }}>
          {groupedMenus.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '48px', fontSize: '11px' }}>
              Không có menu nào hiển thị.
            </div>
          ) : (
            groupedMenus.map((group, gIdx) => (
              <div key={gIdx} style={{ marginBottom: '12px' }}>
                <div style={{
                  fontSize: '8px',
                  fontWeight: 'bold',
                  color: '#64748b',
                  marginBottom: '4px',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}>
                  {CATEGORY_LABELS[group.category] || group.category}
                </div>

                <div style={{
                  background: '#ffffff',
                  borderRadius: '10px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0'
                }}>
                  {(group.items || []).map((item, iIdx) => (
                    <div
                      key={iIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 10px',
                        borderBottom: iIdx === group.items.length - 1 ? 'none' : `1px solid ${item.mnu_brd_color || '#f1f5f9'}`,
                        background: item.mnu_bg_color || '#ffffff',
                      }}
                    >
                      {item.mnu_image ? (
                        <img
                          src={item.mnu_image}
                          alt={item.mnu_name}
                          style={{ width: '16px', height: '16px', objectFit: 'contain', marginRight: '8px' }}
                        />
                      ) : (
                        <div style={{ width: '16px', height: '16px', background: '#e2e8f0', borderRadius: '3px', marginRight: '8px' }} />
                      )}

                      <span style={{ fontSize: '10px', color: item.mnu_txt_color || '#1e293b', fontWeight: '500', flex: 1 }}>
                        {NAME_LABELS[item.mnu_name] || item.mnu_name}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {item.right_icon ? (
                          <img
                            src={item.right_icon}
                            alt="right-icon"
                            style={{ width: '14px', height: '14px', objectFit: 'contain' }}
                          />
                        ) : (
                          <RightOutlined style={{ fontSize: '7px', color: '#cbd5e1' }} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
