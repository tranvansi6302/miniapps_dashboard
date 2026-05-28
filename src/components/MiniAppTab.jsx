import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Card, Badge, Tooltip, Select, Switch, Row, Col, Drawer, Divider, message, Popconfirm, Tag, Collapse, Upload } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined, ReloadOutlined, SearchOutlined, CheckCircleOutlined, StopOutlined, UserAddOutlined, ArrowLeftOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNavigate, useParams, useLocation, useOutletContext } from 'react-router-dom';
import { api } from '../services/api';

const { Option } = Select;

export default function MiniAppTab({ currentUser, forceFormView, isWorkspaceView }) {
  const PERMISSIONS_LIST = [
    { value: 'camera', label: 'Camera' },
    { value: 'location', label: 'Vị trí (Location)' },
    { value: 'storage', label: 'Lưu trữ (Storage)' },
    { value: 'microphone', label: 'Microphone' },
    { value: 'push_notification', label: 'Thông báo đẩy' }
  ];

  const miniAppPerm = currentUser?.username === 'admin' ? 7 : (currentUser?.menu_permissions?.['mini-apps'] || 0);
  const canAdd = (miniAppPerm & 1) === 1;
  const canDelete = (miniAppPerm & 2) === 2;
  const canEdit = (miniAppPerm & 4) === 4;

  const [apps, setApps] = useState([]);
  const [roles, setRoles] = useState([]); // List of system roles from database
  const [builds, setBuilds] = useState([]);
  const [loadingBuilds, setLoadingBuilds] = useState(false);
  const [isBuildModalOpen, setIsBuildModalOpen] = useState(false);
  const [submittingBuild, setSubmittingBuild] = useState(false);
  const [buildForm] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]); // List of all users for bulk membership
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editingApp, setEditingApp] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingZip, setUploadingZip] = useState(false);

  const handleZipUpload = async (file, formInstance) => {
    const isZip = file.type === 'application/zip' || file.name.endsWith('.zip') || file.type === 'application/x-zip-compressed';
    if (!isZip) {
      message.error('Chỉ chấp nhận tệp tin định dạng .zip!');
      return false;
    }

    const versionVal = formInstance.getFieldValue('version');
    if (!versionVal) {
      message.warning('Vui lòng nhập "Số phiên bản (Version)" trước khi tải tệp ZIP lên để đặt tên file chuẩn hóa!');
      return false;
    }

    const formData = new FormData();
    // Gửi kèm thông tin text lên TRƯỚC để Multer bắt được khi parse file
    formData.append('app_id', editingApp?.app_id || editingApp?.appId || 'unknown');
    formData.append('version', versionVal);
    formData.append('file', file);

    setUploadingZip(true);
    try {
      const res = await api.post('/mini-apps/upload', formData);
      const url = res.data?.url || res.url;
      formInstance.setFieldsValue({ file_path: url });
      message.success('Tải lên tệp zip thành công!');
    } catch (err) {
      message.error('Tải lên thất bại: ' + err.message);
    } finally {
      setUploadingZip(false);
    }
    return false; // Chặn Antd tự động upload
  };

  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  // Retrieve layout context for Workspace Sidebar integration
  const context = useOutletContext();
  const { workspaceApp, setWorkspaceApp, workspaceTab, setWorkspaceTab } = context || {};

  // Resolve standard view modes
  const isFormView = !isWorkspaceView && (forceFormView || location.pathname === '/mini-apps/new' || (!!id && location.pathname.includes('/edit')));

  // Drawer Member States (fallback for old drawer logic)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeApp, setActiveApp] = useState(null);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [bulkAddUserIds, setBulkAddUserIds] = useState([]);
  const [bulkAddRoleCode, setBulkAddRoleCode] = useState('tester');
  const [memberBulkActionLoading, setMemberBulkActionLoading] = useState(false);

  // Sync workspace details when route switches to /mini-apps/:id/manage
  useEffect(() => {
    if (isWorkspaceView && id) {
      const loadWorkspace = async () => {
        setLoading(true);
        // Ensure categories are resolved first
        let cats = categories;
        if (categories.length === 0) {
          try {
            const data = await api.get('/categories');
            cats = data.data || data;
            setCategories(cats);
          } catch (err) {
            console.error(err);
          }
        }
        
        try {
          const response = await api.get(`/mini-apps/${id}`);
          const appData = response.data || response;
          if (appData) {
            const cat = cats.find(c => c.id.toString() === (appData.category_id || appData.categoryId)?.toString());
            const catName = cat ? cat.name : 'Chưa phân loại';
            
            // Populate workspaceApp to render Context Sidebar
            if (setWorkspaceApp) {
              setWorkspaceApp({
                ...appData,
                category_name: catName
              });
            }
            
            setEditingApp(appData);
            setActiveApp(appData);
            
            // Hydrate configuration form
            form.setFieldsValue({
              app_id: appData.app_id || appData.appId,
              name: appData.name,
              category_id: appData.category_id ? appData.category_id.toString() : appData.categoryId?.toString(),
              short_description: appData.short_description || appData.shortDescription,
              description: appData.description,
              icon_url: appData.icon_url || appData.logoUrl || appData.iconUrl,
              url: appData.url || appData.iframeUrl,
              version: appData.version,
              requires_auth: appData.requires_auth === true || appData.requiresAuth === true || appData.requires_auth === 'true',
              is_hidden: appData.is_hidden === true || appData.isHidden === true || appData.is_hidden === 'true',
              is_actived: appData.is_actived !== false && appData.isActived !== false && appData.is_actived !== 'false',
              terms_url: appData.terms_url || appData.termsUrl,
              privacy_policy_url: appData.privacy_policy_url || appData.privacyPolicyUrl,
              permissions: appData.permissions || [],
              file_path: appData.file_path || appData.filePath || '',
            });
            
            // Fetch membership list
            await fetchAppMembers(appData.id);
            await fetchUsers();
            await fetchAppBuilds(appData.id);
          }
        } catch (err) {
          message.error('Không thể tải thông tin Mini App: ' + err.message);
        } finally {
          setLoading(false);
        }
      };
      
      loadWorkspace();
    } else {
      if (setWorkspaceApp) {
        setWorkspaceApp(null);
      }
    }
    
    return () => {
      if (setWorkspaceApp) {
        setWorkspaceApp(null);
      }
    };
  }, [isWorkspaceView, id]);

  // Auto-populate form in edit mode or reset in create mode for non-workspace form views
  useEffect(() => {
    if (!isWorkspaceView) {
      if (id && apps.length > 0) {
        const app = apps.find(a => a.id.toString() === id.toString());
        if (app) {
          setEditingApp(app);
          form.setFieldsValue({
            app_id: app.app_id || app.appId,
            name: app.name,
            category_id: app.category_id ? app.category_id.toString() : app.categoryId?.toString(),
            short_description: app.short_description || app.shortDescription,
            description: app.description,
            icon_url: app.icon_url || app.logoUrl || app.iconUrl,
            url: app.url || app.iframeUrl,
            version: app.version,
            requires_auth: app.requires_auth === true || app.requiresAuth === true || app.requires_auth === 'true',
            is_hidden: app.is_hidden === true || app.isHidden === true || app.is_hidden === 'true',
            is_actived: app.is_actived !== false && app.isActived !== false && app.is_actived !== 'false',
            terms_url: app.terms_url || app.termsUrl,
            privacy_policy_url: app.privacy_policy_url || app.privacyPolicyUrl,
            permissions: app.permissions || [],
            file_path: app.file_path || app.filePath || '',
          });
        }
      } else if (!id) {
        setEditingApp(null);
        form.resetFields();
        form.setFieldsValue({
          requires_auth: false,
          is_hidden: false,
          is_actived: true,
          permissions: [],
          file_path: '',
        });
      }
    }
  }, [id, apps, form, isWorkspaceView]);

  useEffect(() => {
    if (isFormView) {
      if (!id && !canAdd) {
        message.error('Bạn không có quyền thêm mới Mini App!');
        navigate('/mini-apps');
      } else if (id && !canEdit) {
        message.error('Bạn không có quyền chỉnh sửa Mini App!');
        navigate('/mini-apps');
      }
    }
  }, [isFormView, id, canAdd, canEdit, navigate]);

  const fetchAppBuilds = async (appId) => {
    setLoadingBuilds(true);
    try {
      const res = await api.get(`/mini-apps/${appId}/builds`);
      setBuilds(res.data || res || []);
    } catch (err) {
      console.error('Không thể tải danh sách bản build:', err);
    } finally {
      setLoadingBuilds(false);
    }
  };

  const handleCreateBuild = async (values) => {
    setSubmittingBuild(true);
    try {
      await api.post(`/mini-apps/${id}/builds`, {
        version: values.version,
        changelog: values.changelog,
        reviewer_notes: values.reviewer_notes,
        file_path: values.file_path
      });
      message.success('Đăng ký bản build mới thành công!');
      setIsBuildModalOpen(false);
      buildForm.resetFields();
      await fetchAppBuilds(id);
    } catch (err) {
      message.error(err.message || 'Tải lên bản build thất bại.');
    } finally {
      setSubmittingBuild(false);
    }
  };

  const handleUpdateBuildStatus = async (buildId, newStatus) => {
    try {
      await api.put(`/mini-apps/${id}/builds/${buildId}/status`, {
        status: newStatus
      });
      message.success(newStatus === 2 ? 'Đã duyệt bản build thành công!' : 'Đã từ chối bản build.');
      
      // Reload builds list
      await fetchAppBuilds(id);
      
      // If approved, reload parent app details to sync the version in state
      const response = await api.get(`/mini-apps/${id}`);
      const appData = response.data || response;
      if (appData) {
        setEditingApp(appData);
        if (setWorkspaceApp) {
          setWorkspaceApp(prev => ({
            ...prev,
            version: appData.version
          }));
        }
      }
    } catch (err) {
      message.error(err.message || 'Cập nhật trạng thái bản build thất bại.');
    }
  };

  const buildColumns = [
    {
      title: 'Phiên bản (Version)',
      dataIndex: 'version',
      key: 'version',
      fontWeight: 'bold',
      render: (text) => <code style={{ color: '#eab308', fontWeight: 600 }}>v{text}</code>,
    },
    {
      title: 'Nội dung phát hành (Changelog)',
      dataIndex: 'changelog',
      key: 'changelog',
      ellipsis: true,
      render: (text) => <span style={{ color: '#cbd5e1' }}>{text || '—'}</span>,
    },
    {
      title: 'Gói ZIP',
      dataIndex: 'file_path',
      key: 'file_path',
      width: 100,
      render: (filePath) => {
        return filePath ? (
          <Tooltip title="Tải gói zip phiên bản này">
            <Button
              type="text"
              icon={<DownloadOutlined style={{ color: '#eab308' }} />}
              onClick={() => window.open(filePath, '_blank')}
            />
          </Tooltip>
        ) : (
          <span style={{ color: '#64748b', fontSize: '12px' }}>Không có</span>
        );
      }
    },
    {
      title: 'Ghi chú duyệt',
      dataIndex: 'reviewer_notes',
      key: 'reviewer_notes',
      ellipsis: true,
      render: (text) => <span style={{ color: '#94a3b8' }}>{text || '—'}</span>,
    },
    {
      title: 'Ngày tải lên',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => <span style={{ color: '#64748b' }}>{new Date(date).toLocaleString('vi-VN')}</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        if (status === 1) return <Badge status="processing" text={<span style={{ color: '#38bdf8' }}>Chờ duyệt</span>} />;
        if (status === 2) return <Badge status="success" text={<span style={{ color: '#4ade80' }}>Đã duyệt</span>} />;
        return <Badge status="error" text={<span style={{ color: '#f87171' }}>Từ chối</span>} />;
      },
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, record) => {
        const isPending = record.status === 1;
        const isApproved = record.status === 2;
        const isActive = record.version === editingApp?.version;
        return (
          <Space>
            {isPending && canEdit && (
              <>
                <Popconfirm
                  title="Duyệt bản build này?"
                  description="Phiên bản của Mini App sẽ được cập nhật thành phiên bản này."
                  onConfirm={() => handleUpdateBuildStatus(record.id, 2)}
                  okText="Duyệt"
                  cancelText="Hủy"
                >
                  <Button type="primary" size="small" style={{ background: '#10b981', border: 'none', borderRadius: '4px' }}>
                    Duyệt
                  </Button>
                </Popconfirm>
                <Popconfirm
                  title="Từ chối bản build này?"
                  onConfirm={() => handleUpdateBuildStatus(record.id, 3)}
                  okText="Từ chối"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                >
                  <Button danger type="primary" size="small" style={{ borderRadius: '4px' }}>
                    Từ chối
                  </Button>
                </Popconfirm>
              </>
            )}
            {isApproved && (
              isActive ? (
                <Tag color="success" style={{ margin: 0 }}>Đang hoạt động</Tag>
              ) : canEdit ? (
                <Popconfirm
                  title="Xác nhận khôi phục (Rollback) về phiên bản này?"
                  description={`Hệ thống sẽ chuyển phiên bản hoạt động hiện tại về v${record.version}.`}
                  onConfirm={() => handleUpdateBuildStatus(record.id, 2)}
                  okText="Xác nhận"
                  cancelText="Hủy"
                >
                  <Button type="primary" size="small" style={{ background: '#6366f1', border: 'none', borderRadius: '4px' }}>
                    Rollback
                  </Button>
                </Popconfirm>
              ) : (
                <span style={{ color: '#64748b', fontSize: '12px' }}>Không có thao tác</span>
              )
            )}
            {record.status === 3 && (
              <span style={{ color: '#ef4444', fontSize: '12px' }}>Đã từ chối</span>
            )}
          </Space>
        );
      },
    },
  ];

  const fetchCategories = async () => {
    try {
      const data = await api.get('/categories');
      setCategories(data.data || data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await api.get('/users');
      setUsers(data.data || data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await api.get('/mini-apps/meta/roles');
      setRoles(data.data || data || []);
    } catch (err) {
      console.error('Không thể tải danh sách vai trò:', err);
    }
  };

  const fetchApps = async () => {
    setLoading(true);
    try {
      let query = '?include_hidden=true&include_inactive=true';
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (selectedCategory) query += `&category_id=${selectedCategory}`;

      const data = await api.get(`/mini-apps${query}`);
      setApps(data.data || data);
    } catch (err) {
      message.error('Không thể lấy danh sách Mini Apps: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchUsers();
    fetchApps();
    fetchRoles();
  }, [selectedCategory]);

  const handleSearch = () => {
    fetchApps();
  };

  const handleCreateClick = () => {
    if (!currentUser) {
      message.warning('Bạn cần đăng nhập để tạo mới Mini App!');
      return;
    }
    navigate('/mini-apps/new');
  };

  const handleEditClick = (app) => {
    if (!currentUser) {
      message.warning('Bạn cần đăng nhập để chỉnh sửa Mini App!');
      return;
    }
    navigate(`/mini-apps/${app.id}/edit`);
  };

  const handleDelete = async (id) => {
    if (!currentUser) {
      message.warning('Bạn cần đăng nhập để xóa Mini App!');
      return;
    }
    try {
      await api.delete(`/mini-apps/${id}`);
      message.success('Xóa Mini App thành công!');
      fetchApps();
    } catch (err) {
      message.error(err.message || 'Không thể xóa Mini App.');
    }
  };

  const handleToggleField = async (fieldName, currentValue) => {
    if (!currentUser) {
      message.warning('Bạn cần đăng nhập để thực hiện thao tác này!');
      return;
    }
    setSubmitting(true);
    try {
      const newValue = !currentValue;
      const payload = {
        app_id: editingApp.app_id || editingApp.appId,
        name: editingApp.name,
        category_id: parseInt(editingApp.category_id || editingApp.categoryId),
        short_description: editingApp.short_description || editingApp.shortDescription || '',
        description: editingApp.description || '',
        icon_url: editingApp.icon_url || editingApp.logoUrl || editingApp.iconUrl || '',
        url: editingApp.url || editingApp.iframeUrl,
        version: editingApp.version,
        requires_auth: editingApp.requires_auth === true || editingApp.requiresAuth === true,
        terms_url: editingApp.terms_url || editingApp.termsUrl || '',
        privacy_policy_url: editingApp.privacy_policy_url || editingApp.privacyPolicyUrl || '',
        permissions: editingApp.permissions || [],
        file_path: editingApp.file_path || editingApp.filePath || '',
        is_hidden: fieldName === 'is_hidden' ? newValue : (editingApp.is_hidden === true || editingApp.isHidden === true),
        is_actived: fieldName === 'is_actived' ? newValue : (editingApp.is_actived !== false && editingApp.isActived !== false),
      };

      await api.put(`/mini-apps/${editingApp.id}`, payload);
      
      const successMsg = fieldName === 'is_hidden' 
        ? (newValue ? 'Đã ẩn Mini App khỏi Store!' : 'Đã hiển thị Mini App tại Store!')
        : (newValue ? 'Đã kích hoạt Mini App thành công!' : 'Đã tạm dừng hoạt động Mini App!');
      
      message.success(successMsg);

      // Refresh workspace data
      const response = await api.get(`/mini-apps/${editingApp.id}`);
      const appData = response.data || response;
      if (appData) {
        const cat = categories.find(c => c.id.toString() === (appData.category_id || appData.categoryId)?.toString());
        const catName = cat ? cat.name : 'Chưa phân loại';
        
        const newAppInfo = {
          ...appData,
          category_name: catName
        };
        
        if (setWorkspaceApp) {
          setWorkspaceApp(newAppInfo);
        }
        setEditingApp(appData);
        setActiveApp(appData);
        
        // Update form values
        form.setFieldsValue({
          app_id: appData.app_id || appData.appId,
          name: appData.name,
          category_id: appData.category_id ? appData.category_id.toString() : appData.categoryId?.toString(),
          short_description: appData.short_description || appData.shortDescription,
          description: appData.description,
          icon_url: appData.icon_url || appData.logoUrl || appData.iconUrl,
          url: appData.url || appData.iframeUrl,
          version: appData.version,
          requires_auth: appData.requires_auth === true || appData.requiresAuth === true,
          is_hidden: appData.is_hidden === true || appData.isHidden === true,
          is_actived: appData.is_actived !== false && appData.isActived !== false,
          terms_url: appData.terms_url || appData.termsUrl,
          privacy_policy_url: appData.privacy_policy_url || appData.privacyPolicyUrl,
          permissions: appData.permissions || [],
        });
      }
    } catch (err) {
      message.error('Thao tác thất bại: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        app_id: values.app_id,
        name: values.name,
        category_id: parseInt(values.category_id),
        short_description: values.short_description,
        description: values.description,
        icon_url: values.icon_url,
        url: values.url,
        version: values.version,
        requires_auth: !!values.requires_auth,
        is_hidden: isWorkspaceView ? (editingApp.is_hidden === true || editingApp.isHidden === true) : !!values.is_hidden,
        is_actived: isWorkspaceView ? (editingApp.is_actived !== false && editingApp.isActived !== false) : !!values.is_actived,
        terms_url: values.terms_url,
        privacy_policy_url: values.privacy_policy_url,
        permissions: values.permissions || [],
        file_path: values.file_path || '',
      };

      if (editingApp) {
        await api.put(`/mini-apps/${editingApp.id}`, payload);
        message.success('Cập nhật Mini App thành công!');
        // Keep sidebar updated if workspace is active
        if (isWorkspaceView && setWorkspaceApp) {
          const updatedCat = categories.find(c => c.id.toString() === payload.category_id?.toString());
          setWorkspaceApp({
            ...editingApp,
            ...payload,
            category_name: updatedCat ? updatedCat.name : 'Chưa phân loại'
          });
        }
      } else {
        await api.post('/mini-apps', payload);
        message.success('Tạo Mini App mới thành công!');
      }
      
      if (!isWorkspaceView) {
        navigate('/mini-apps');
      }
      fetchApps();
    } catch (err) {
      message.error(err.message || 'Lưu thông tin thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  // MEMBERS MANAGEMENT DRAWERS FUNCTIONS
  const handleOpenMembersDrawer = async (app) => {
    setActiveApp(app);
    setDrawerOpen(true);
    setBulkAddUserIds([]);
    setBulkAddRoleCode('tester');
    setSelectedMemberIds([]);
    await fetchAppMembers(app.id);
  };

  const fetchAppMembers = async (appId) => {
    setMembersLoading(true);
    try {
      const data = await api.get(`/mini-apps/${appId}/members`);
      setMembers(data.data || data);
    } catch (err) {
      message.error('Không thể tải thành viên: ' + err.message);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleBulkAddMembers = async () => {
    if (!currentUser) {
      message.warning('Bạn cần đăng nhập để thao tác thành viên!');
      return;
    }
    if (bulkAddUserIds.length === 0) {
      message.warning('Vui lòng chọn ít nhất một người dùng!');
      return;
    }
    setMemberBulkActionLoading(true);
    try {
      await api.post(`/mini-apps/${activeApp.id}/members`, {
        user_ids: bulkAddUserIds,
        status: 1, // Approved
        role_code: bulkAddRoleCode
      });
      message.success('Thêm thành viên hàng loạt thành công!');
      setBulkAddUserIds([]);
      setBulkAddRoleCode('tester');
      fetchAppMembers(activeApp.id);
    } catch (err) {
      message.error(err.message || 'Không thể thêm thành viên.');
    } finally {
      setMemberBulkActionLoading(false);
    }
  };

  const handleBulkUpdateMemberRole = async (roleCode) => {
    if (!currentUser) {
      message.warning('Bạn cần đăng nhập để thao tác thành viên!');
      return;
    }
    if (selectedMemberIds.length === 0) {
      message.warning('Vui lòng chọn ít nhất một thành viên trong danh sách!');
      return;
    }
    setMemberBulkActionLoading(true);
    try {
      await api.put(`/mini-apps/${activeApp.id}/members`, {
        user_ids: selectedMemberIds,
        role_code: roleCode
      });
      message.success('Cập nhật vai trò thành viên hàng loạt thành công!');
      setSelectedMemberIds([]);
      fetchAppMembers(activeApp.id);
    } catch (err) {
      message.error(err.message || 'Cập nhật vai trò thất bại.');
    } finally {
      setMemberBulkActionLoading(false);
    }
  };

  const handleBulkUpdateMemberStatus = async (statusVal) => {
    if (!currentUser) {
      message.warning('Bạn cần đăng nhập để thao tác thành viên!');
      return;
    }
    if (selectedMemberIds.length === 0) {
      message.warning('Vui lòng chọn ít nhất một thành viên trong danh sách!');
      return;
    }
    setMemberBulkActionLoading(true);
    try {
      await api.put(`/mini-apps/${activeApp.id}/members`, {
        user_ids: selectedMemberIds,
        status: statusVal
      });
      message.success('Cập nhật trạng thái thành viên hàng loạt thành công!');
      setSelectedMemberIds([]);
      fetchAppMembers(activeApp.id);
    } catch (err) {
      message.error(err.message || 'Cập nhật thất bại.');
    } finally {
      setMemberBulkActionLoading(false);
    }
  };

  const handleBulkRemoveMembers = async () => {
    if (!currentUser) {
      message.warning('Bạn cần đăng nhập để thao tác thành viên!');
      return;
    }
    if (selectedMemberIds.length === 0) {
      message.warning('Vui lòng chọn ít nhất một thành viên trong danh sách!');
      return;
    }
    setMemberBulkActionLoading(true);
    try {
      await api.delete(`/mini-apps/${activeApp.id}/members`, {
        user_ids: selectedMemberIds
      });
      message.success('Xóa thành viên hàng loạt thành công!');
      setSelectedMemberIds([]);
      fetchAppMembers(activeApp.id);
    } catch (err) {
      message.error(err.message || 'Xóa thất bại.');
    } finally {
      setMemberBulkActionLoading(false);
    }
  };

  // Helper mapping category name
  const getCategoryName = (catId) => {
    const cat = categories.find(c => c.id.toString() === catId?.toString());
    return cat ? cat.name : 'Chưa phân loại';
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
      title: 'Ứng Dụng',
      key: 'app_name',
      render: (_, record) => (
        <span 
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          onClick={() => {
            if (setWorkspaceTab) setWorkspaceTab('overview');
            navigate(`/mini-apps/${record.id}/manage`);
          }}
          className="workspace-link"
        >
          {record.icon_url || record.logoUrl ? (
            <img src={record.icon_url || record.logoUrl} alt={record.name} style={{ width: '32px', height: '32px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.05)', objectFit: 'contain' }} />
          ) : (
            <div style={{ width: '32px', height: '32px', borderRadius: '5px', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{record.name[0]}</div>
          )}
          <div>
            <div style={{ fontWeight: 600, color: '#f8fafc' }} className="workspace-link-name">{record.name}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>{record.app_id || record.appId}</div>
          </div>
        </span>
      )
    },
    {
      title: 'Danh mục',
      key: 'category',
      render: (_, record) => {
        const catId = record.category_id || record.categoryId;
        return <Tag color="blue">{getCategoryName(catId)}</Tag>;
      }
    },
    {
      title: 'Quyền',
      key: 'permissions',
      render: (_, record) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '180px' }}>
          {(record.permissions || []).map(p => (
            <Tag color="cyan" key={p} style={{ margin: 0, fontSize: '11px' }}>
              {PERMISSIONS_LIST.find(pl => pl.value === p)?.label || p}
            </Tag>
          ))}
          {(!record.permissions || record.permissions.length === 0) && <span style={{ color: '#64748b', fontSize: '12px' }}>Không có</span>}
        </div>
      )
    },
    {
      title: 'Đường dẫn App',
      dataIndex: 'url',
      key: 'url',
      ellipsis: true,
      render: (text, record) => <span style={{ color: '#a5b4fc', fontSize: '13px' }}>{text || record.iframeUrl}</span>
    },
    {
      title: 'Phiên bản',
      dataIndex: 'version',
      key: 'version',
      width: 100,
      render: (v) => <code style={{ color: '#22c55e' }}>v{v}</code>
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 160,
      render: (_, record) => {
        const active = record.is_actived !== false && record.is_actived !== 'false' && record.isActived !== false;
        const hidden = record.is_hidden === true || record.is_hidden === 'true' || record.isHidden === true;

        return (
          <Space direction="vertical" size={2}>
            {active ? (
              <Badge status="success" text={<span style={{ color: '#4ade80', fontSize: '13px' }}>Hoạt động</span>} />
            ) : (
              <Badge status="error" text={<span style={{ color: '#f87171', fontSize: '13px' }}>Tạm dừng</span>} />
            )}
            {hidden && <Tag color="warning" style={{ margin: 0, scale: '0.9' }}>Đang ẩn</Tag>}
          </Space>
        );
      }
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Thành viên">
            <Button
              type="text"
              icon={<TeamOutlined style={{ color: '#10b981' }} />}
              onClick={() => {
                if (setWorkspaceTab) setWorkspaceTab('members');
                navigate(`/mini-apps/${record.id}/manage`);
              }}
            />
          </Tooltip>
          <Tooltip title={currentUser ? "Quản lý" : "Yêu cầu đăng nhập"}>
            <Button
              type="text"
              icon={<EditOutlined style={{ color: currentUser ? '#6366f1' : '#64748b' }} />}
              onClick={() => {
                if (setWorkspaceTab) setWorkspaceTab('overview');
                navigate(`/mini-apps/${record.id}/manage`);
              }}
            />
          </Tooltip>
          {record.file_path && (
            <Tooltip title="Tải gói Offline (.zip)">
              <Button
                type="text"
                icon={<DownloadOutlined style={{ color: '#eab308' }} />}
                onClick={() => window.open(record.file_path, '_blank')}
              />
            </Tooltip>
          )}
          <Tooltip title={canDelete ? "Xóa" : "Bạn không có quyền xóa"}>
            <Popconfirm
              title="Xác nhận xóa Mini App này?"
              description="Hệ thống sẽ thực hiện khóa/xóa mềm ứng dụng này."
              onConfirm={() => handleDelete(record.id)}
              okText="Đồng ý"
              cancelText="Hủy"
              disabled={!canDelete}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined style={{ color: canDelete ? '#ef4444' : '#64748b' }} />}
                disabled={!canDelete}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  // Members Table Columns inside Drawer / Workspace
  const memberColumns = [
    {
      title: 'Tên thành viên',
      key: 'member_name',
      render: (_, record) => (
        <div>
          <span style={{ fontWeight: 600, color: '#f8fafc' }}>{record.full_name || record.fullName || record.username}</span>
          <div style={{ fontSize: '12px', color: '#64748b' }}>@{record.username}</div>
        </div>
      )
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (t) => <span style={{ color: '#94a3b8' }}>{t || '—'}</span>
    },
    {
      title: 'Vai trò',
      dataIndex: 'role_code',
      key: 'role_code',
      width: 150,
      render: (roleCode) => {
        const foundRole = roles.find(r => r.code === roleCode);
        const name = foundRole ? foundRole.name : (roleCode || 'Kiểm thử viên (Tester)');
        
        let color = 'default';
        if (roleCode === 'admin') color = 'magenta';
        else if (roleCode === 'developer') color = 'blue';
        else if (roleCode === 'tester') color = 'orange';
        
        return <Tag color={color} style={{ fontWeight: 500 }}>{name}</Tag>;
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (s) => {
        if (s === 1) return <Tag color="success">Đã duyệt</Tag>;
        if (s === 2) return <Tag color="warning">Tạm khóa</Tag>;
        return <Tag color="error">Đã xóa</Tag>;
      }
    }
  ];

  // Candidates for bulk add membership (users who are not already approved or active members in the active workspace app)
  const candidateUsers = users.filter(user => {
    return !members.some(m => m.user_id?.toString() === user.id.toString() && m.status !== 3);
  });

  // RENDER DEDICATED WORKSPACE PORTAL VIEW
  if (isWorkspaceView) {
    if (loading && !workspaceApp) {
      return (
        <Card
          bordered={false}
          style={{
            background: 'rgba(30, 41, 59, 0.65)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '5px',
            minHeight: '350px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 20px 45px -15px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div style={{ textAlign: 'center', color: '#94a3b8' }}>
            <ReloadOutlined spin style={{ fontSize: '32px', color: '#6366f1', marginBottom: '16px' }} />
            <div style={{ fontSize: '13px', fontWeight: 500 }}>Đang tải không gian làm việc...</div>
          </div>
        </Card>
      );
    }

    return (
      <div style={{ padding: 0 }}>
        {workspaceTab === 'overview' ? (
          <Card
            title={
              <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>
                Thông tin tổng quan & Cấu hình Mini App
              </span>
            }
            bordered={false}
            style={{
              background: 'rgba(30, 41, 59, 0.65)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '5px',
              boxShadow: '0 20px 45px -15px rgba(0, 0, 0, 0.5)',
            }}
            styles={{
              body: {
                padding: '16px',
              }
            }}
          >
            <div style={{ overflowX: 'hidden' }}>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleModalSubmit}
                requiredMark={false}
              >
                <Row gutter={12}>
                  <Col span={8}>
                    <Form.Item
                      name="name"
                      label={<span style={{ color: '#e2e8f0' }}>Tên Ứng dụng</span>}
                      rules={[{ required: true, message: 'Nhập tên ứng dụng!' }]}
                    >
                      <Input placeholder="Ví dụ: Booking App" style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="app_id"
                      label={<span style={{ color: '#e2e8f0' }}>Mã định danh (App ID)</span>}
                      rules={[
                        { required: true, message: 'Nhập mã định danh!' },
                        { pattern: /^[a-z0-9.]+$/, message: 'Chỉ chấp nhận chữ thường không dấu, số, dấu chấm!' }
                      ]}
                    >
                      <Input placeholder="Ví dụ: com.ejsc.booking" disabled={true} style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="category_id"
                      label={<span style={{ color: '#e2e8f0' }}>Danh mục</span>}
                      rules={[{ required: true, message: 'Chọn danh mục!' }]}
                    >
                      <Select placeholder="Chọn danh mục" dropdownStyle={{ background: '#1e293b' }}>
                        {categories.map(c => (
                          <Option key={c.id} value={c.id.toString()}>{c.name}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={12}>
                  <Col span={8}>
                    <Form.Item
                      name="version"
                      label={<span style={{ color: '#e2e8f0' }}>Phiên bản</span>}
                      rules={[{ required: true, message: 'Nhập phiên bản!' }]}
                    >
                      <Input placeholder="Ví dụ: 1.0.0" style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="url"
                      label={<span style={{ color: '#e2e8f0' }}>Đường dẫn Iframe chính (URL)</span>}
                      rules={[{ required: true, message: 'Nhập iframe URL!' }]}
                    >
                      <Input placeholder="https://yourdomain.com/booking-iframe" style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="icon_url"
                      label={<span style={{ color: '#e2e8f0' }}>Ảnh Logo (URL)</span>}
                    >
                      <Input placeholder="https://yourdomain.com/logo.png" style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={12}>
                  <Col span={8}>
                    <Form.Item
                      name="terms_url"
                      label={<span style={{ color: '#e2e8f0' }}>Điều khoản sử dụng (URL)</span>}
                    >
                      <Input placeholder="https://yourdomain.com/terms" style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="privacy_policy_url"
                      label={<span style={{ color: '#e2e8f0' }}>Chính sách bảo mật (URL)</span>}
                    >
                      <Input placeholder="https://yourdomain.com/privacy" style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="short_description"
                      label={<span style={{ color: '#e2e8f0' }}>Mô tả ngắn gọn</span>}
                    >
                      <Input placeholder="Thông tin tóm tắt" style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={12}>
                  <Col span={18}>
                    <Form.Item
                      name="file_path"
                      label={<span style={{ color: '#e2e8f0' }}>Đường dẫn gói Offline hiện hành (ZIP URL)</span>}
                      extra={<span style={{ color: '#64748b', fontSize: '11px' }}>Tự động đồng bộ từ bản build mới nhất được duyệt (Approved).</span>}
                    >
                      <Input 
                        disabled={true}
                        placeholder="Chưa có gói offline nào được kích hoạt" 
                        style={{ background: 'rgba(15, 23, 42, 0.4)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.06)' }} 
                      />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      label={<span style={{ color: '#e2e8f0' }}>Tải gói Offline</span>}
                    >
                      <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.file_path !== currentValues.file_path}>
                        {({ getFieldValue }) => {
                          const filePath = getFieldValue('file_path');
                          return filePath ? (
                            <Button
                              icon={<DownloadOutlined />}
                              onClick={() => window.open(filePath, '_blank')}
                              style={{ width: '100%', background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.4)', color: '#fef08a' }}
                            >
                              Tải về (.zip)
                            </Button>
                          ) : (
                            <Button
                              disabled={true}
                              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#64748b' }}
                            >
                              Chưa kích hoạt
                            </Button>
                          );
                        }}
                      </Form.Item>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={12}>
                  <Col span={24}>
                    <Form.Item
                      name="description"
                      label={<span style={{ color: '#e2e8f0' }}>Mô tả chi tiết</span>}
                    >
                      <Input.TextArea placeholder="Mô tả đầy đủ của Mini App" rows={3} style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={12}>
                  <Col span={24}>
                    <Form.Item
                      name="permissions"
                      label={<span style={{ color: '#e2e8f0' }}>Quyền truy cập (Permissions)</span>}
                    >
                      <Select
                        mode="multiple"
                        placeholder="Chọn các quyền yêu cầu..."
                        style={{ width: '100%' }}
                        dropdownStyle={{ background: '#1e293b' }}
                        options={PERMISSIONS_LIST}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={12} style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '5px', marginBottom: '24px' }}>
                  <Col span={24}>
                    <Form.Item
                      name="requires_auth"
                      label={<span style={{ color: '#e2e8f0' }}>Yêu cầu Auth Login</span>}
                      valuePropName="checked"
                      style={{ marginBottom: 0 }}
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                  {canEdit && (
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={submitting}
                      style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none' }}
                    >
                      Lưu cập nhật
                    </Button>
                  )}
                </Form.Item>
              </Form>



              {/* Danger Zone Container */}
              <div style={{
                border: '1px solid #ef4444',
                borderRadius: '5px',
                padding: '20px',
                marginTop: '32px',
                background: 'rgba(239, 68, 68, 0.02)'
              }}>
                <h3 style={{
                  color: '#f87171',
                  fontSize: '14px',
                  fontWeight: 600,
                  margin: '0 0 16px 0'
                }}>
                  Vùng nguy hiểm
                </h3>
                
                {/* Row 1: Ẩn/Hiện Mini App */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div>
                    <h4 style={{ color: '#f8fafc', margin: '0 0 4px 0', fontSize: '13px', fontWeight: 600 }}>
                      {(editingApp?.is_hidden === true || editingApp?.isHidden === true) ? 'Hiện Mini App' : 'Ẩn Mini App'}
                    </h4>
                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                      {(editingApp?.is_hidden === true || editingApp?.isHidden === true)
                        ? 'Mini App đang bị ẩn khỏi Store.'
                        : 'Mini App đang bị ẩn khỏi Store.'}
                    </span>
                  </div>
                  <Button
                    onClick={() => handleToggleField('is_hidden', (editingApp?.is_hidden === true || editingApp?.isHidden === true))}
                    disabled={!canEdit}
                    style={{
                      background: canEdit ? '#ef4444' : '#64748b',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '5px',
                      fontWeight: 600,
                      padding: '8px 18px',
                      height: 'auto',
                      fontSize: '12px',
                      cursor: canEdit ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {(editingApp?.is_hidden === true || editingApp?.isHidden === true) ? 'Hiện Mini App' : 'Ẩn Mini App'}
                  </Button>
                </div>

                {/* Row 2: Kích hoạt/Xóa (Tạm dừng) Mini App */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '16px'
                }}>
                  <div>
                    <h4 style={{ color: '#f8fafc', margin: '0 0 4px 0', fontSize: '13px', fontWeight: 600 }}>
                      {(editingApp?.is_actived !== false && editingApp?.isActived !== false) ? 'Xóa Mini App' : 'Kích hoạt Mini App'}
                    </h4>
                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                      {(editingApp?.is_actived !== false && editingApp?.isActived !== false)
                        ? 'Xóa hoàn toàn Mini App của bạn khỏi V-App.'
                        : 'Kích hoạt lại Mini App của bạn trên V-App.'}
                    </span>
                  </div>
                  <Popconfirm
                    title={(editingApp?.is_actived !== false && editingApp?.isActived !== false) ? "Xác nhận xóa Mini App?" : "Xác nhận kích hoạt lại Mini App?"}
                    description={(editingApp?.is_actived !== false && editingApp?.isActived !== false) ? "Thay đổi trạng thái ứng dụng thành Không hoạt động." : "Thay đổi trạng thái ứng dụng thành Hoạt động."}
                    onConfirm={() => handleToggleField('is_actived', (editingApp?.is_actived !== false && editingApp?.isActived !== false))}
                    okText="Xác nhận"
                    cancelText="Hủy"
                  >
                    <Button
                      disabled={!canDelete}
                      style={{
                        background: canDelete ? '#ef4444' : '#64748b',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '5px',
                        fontWeight: 600,
                        padding: '8px 18px',
                        height: 'auto',
                        fontSize: '12px',
                        cursor: canDelete ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {(editingApp?.is_actived !== false && editingApp?.isActived !== false) ? 'Xóa Mini App' : 'Kích hoạt'}
                    </Button>
                  </Popconfirm>
                </div>
              </div>
            </div>
          </Card>
        ) : workspaceTab === 'versions' ? (
          <Card
            title={
              <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>
                Thông tin bản build & Lịch sử phiên bản
              </span>
            }
            bordered={false}
            style={{
              background: 'rgba(30, 41, 59, 0.65)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '5px',
              boxShadow: '0 20px 45px -15px rgba(0, 0, 0, 0.5)',
            }}
            styles={{
              body: {
                padding: '16px',
              }
            }}
            extra={
              canAdd && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    buildForm.resetFields();
                    setIsBuildModalOpen(true);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    border: 'none',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
                  }}
                >
                  Tạo bản build mới
                </Button>
              )
            }
          >
            <Table
              columns={buildColumns}
              dataSource={builds.map(b => ({ ...b, key: b.id }))}
              loading={loadingBuilds}
              pagination={{ pageSize: 8, showSizeChanger: false }}
              locale={{ emptyText: <span style={{ color: '#94a3b8' }}>Chưa có bản build nào được đăng ký.</span> }}
              style={{ background: 'transparent' }}
              className="custom-table"
              size="small"
            />

            {/* Build Creation Modal */}
            <Modal
              title={<span style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>Đăng ký bản build phiên bản mới</span>}
              open={isBuildModalOpen}
              onCancel={() => setIsBuildModalOpen(false)}
              footer={null}
              destroyOnClose
              wrapClassName="dark-modal"
              width={500}
            >
              <Form
                form={buildForm}
                layout="vertical"
                onFinish={handleCreateBuild}
                requiredMark={false}
              >
                <Form.Item
                  name="version"
                  label={<span style={{ color: '#e2e8f0' }}>Số phiên bản (Version)</span>}
                  rules={[
                    { required: true, message: 'Vui lòng nhập số phiên bản!' },
                    { pattern: /^[0-9.]+$/, message: 'Chỉ chấp nhận số và dấu chấm (ví dụ: 1.1.0)' }
                  ]}
                >
                  <Input
                    placeholder="Ví dụ: 1.1.0"
                    style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </Form.Item>

                <Form.Item
                  name="changelog"
                  label={<span style={{ color: '#e2e8f0' }}>Nội dung phát hành (Changelog)</span>}
                  rules={[{ required: true, message: 'Vui lòng nhập nội dung thay đổi!' }]}
                >
                  <Input.TextArea
                    rows={4}
                    placeholder="Mô tả các thay đổi, sửa lỗi hoặc tính năng mới..."
                    style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </Form.Item>

                <Form.Item
                  name="reviewer_notes"
                  label={<span style={{ color: '#e2e8f0' }}>Ghi chú cho người duyệt (Reviewer Notes)</span>}
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="Thông tin tài khoản kiểm thử, ghi chú cấu hình đặc biệt..."
                    style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </Form.Item>

                <Row gutter={12}>
                  <Col span={15}>
                    <Form.Item
                      name="file_path"
                      label={<span style={{ color: '#e2e8f0' }}>Đường dẫn gói Offline (ZIP URL)</span>}
                      rules={[{ required: true, message: 'Vui lòng tải lên hoặc điền đường dẫn gói .zip!' }]}
                      extra={<span style={{ color: '#64748b', fontSize: '11px' }}>Tệp zip chứa static source (HTML/JS/CSS) cho bản build này.</span>}
                    >
                      <Input
                        placeholder="Link tải tệp .zip"
                        style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={9}>
                    <Form.Item
                      label={<span style={{ color: '#e2e8f0' }}>Tải lên file ZIP</span>}
                    >
                      <Space direction="vertical" style={{ width: '100%' }} size={4}>
                        <Upload
                          beforeUpload={(file) => handleZipUpload(file, buildForm)}
                          showUploadList={false}
                          disabled={uploadingZip}
                        >
                          <Button
                            icon={<UploadOutlined />}
                            loading={uploadingZip}
                            style={{ width: '100%', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.4)', color: '#a5b4fc' }}
                          >
                            {uploadingZip ? 'Tải...' : 'Chọn .zip'}
                          </Button>
                        </Upload>
                        <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.file_path !== currentValues.file_path}>
                          {({ getFieldValue }) => {
                            const filePath = getFieldValue('file_path');
                            return filePath ? (
                              <Button
                                icon={<DownloadOutlined />}
                                onClick={() => window.open(filePath, '_blank')}
                                style={{ width: '100%', background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.4)', color: '#fef08a', fontSize: '11px', height: '32px' }}
                              >
                                Tải file
                              </Button>
                            ) : null;
                          }}
                        </Form.Item>
                      </Space>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item style={{ marginBottom: 0, marginTop: '24px', textAlign: 'right' }}>
                  <Space>
                    <Button onClick={() => setIsBuildModalOpen(false)} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none' }}>
                      Hủy bỏ
                    </Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={submittingBuild}
                      style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none' }}
                    >
                      Đăng ký
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Modal>
          </Card>
        ) : (
          <Card
            title={
              <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>
                Quản lý Danh sách Thành viên Mini App
              </span>
            }
            bordered={false}
            style={{
              background: 'rgba(30, 41, 59, 0.65)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '5px',
              boxShadow: '0 20px 45px -15px rgba(0, 0, 0, 0.5)',
            }}
            styles={{
              body: {
                padding: '16px',
              }
            }}
          >
            {/* Bulk Add Tool */}
            <div style={{ background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '5px', marginBottom: '24px' }}>
              <h4 style={{ color: '#fff', marginTop: 0, marginBottom: '12px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserAddOutlined style={{ color: '#6366f1' }} />
                Thêm Thành viên Hàng loạt (Bulk Add)
              </h4>
              <Row gutter={12} align="middle">
                <Col span={12}>
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder="Chọn một hoặc nhiều tài khoản..."
                    value={bulkAddUserIds}
                    onChange={setBulkAddUserIds}
                    style={{ width: '100%' }}
                    dropdownStyle={{ background: '#1e293b' }}
                    loading={membersLoading}
                    optionFilterProp="children"
                  >
                    {candidateUsers.map(user => (
                      <Option key={user.id} value={user.id}>
                        {user.full_name || user.fullName || user.username} (@{user.username})
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col span={6}>
                  <Select
                    value={bulkAddRoleCode}
                    onChange={setBulkAddRoleCode}
                    style={{ width: '100%' }}
                    placeholder="Chọn vai trò..."
                    dropdownStyle={{ background: '#1e293b' }}
                  >
                    {roles.map(r => (
                      <Option key={r.code} value={r.code}>{r.name}</Option>
                    ))}
                  </Select>
                </Col>
                <Col span={6}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    block
                    disabled={bulkAddUserIds.length === 0 || !currentUser || !canEdit}
                    onClick={handleBulkAddMembers}
                    loading={memberBulkActionLoading}
                    style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none' }}
                  >
                    Thêm hàng loạt
                  </Button>
                </Col>
              </Row>
            </div>

            {/* Actions for selected members */}
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                Đã chọn: <strong style={{ color: '#6366f1' }}>{selectedMemberIds.length}</strong> thành viên
              </span>
              {selectedMemberIds.length > 0 && (
                <Space wrap>
                  <Button
                    type="primary"
                    size="small"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleBulkUpdateMemberStatus(1)}
                    loading={memberBulkActionLoading}
                    disabled={!canEdit}
                    style={{ background: '#10b981', border: 'none' }}
                  >
                    Duyệt hoạt động
                  </Button>
                  <Button
                    type="primary"
                    size="small"
                    icon={<StopOutlined />}
                    onClick={() => handleBulkUpdateMemberStatus(2)}
                    loading={memberBulkActionLoading}
                    disabled={!canEdit}
                    style={{ background: '#f59e0b', border: 'none' }}
                  >
                    Khóa tạm thời
                  </Button>

                  {roles.length > 0 && (
                    <>
                      <Divider type="vertical" style={{ borderColor: 'rgba(255,255,255,0.15)' }} />
                      <span style={{ color: '#94a3b8', fontSize: '12px' }}>Gán vai trò:</span>
                      {roles.map(r => (
                        <Button
                          key={r.code}
                          size="small"
                          onClick={() => handleBulkUpdateMemberRole(r.code)}
                          loading={memberBulkActionLoading}
                          disabled={!canEdit}
                          style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#a5b4fc', fontSize: '11px', borderRadius: '4px' }}
                        >
                          {r.name}
                        </Button>
                      ))}
                    </>
                  )}

                  <Divider type="vertical" style={{ borderColor: 'rgba(255,255,255,0.15)' }} />
                  <Popconfirm
                    title="Xác nhận xóa hàng loạt thành viên đã chọn?"
                    onConfirm={handleBulkRemoveMembers}
                    okText="Xóa"
                    cancelText="Hủy"
                    disabled={!canDelete}
                  >
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      loading={memberBulkActionLoading}
                      disabled={!canDelete}
                    >
                      Xóa khỏi nhóm
                    </Button>
                  </Popconfirm>
                </Space>
              )}
            </div>

            <Table
              rowSelection={{
                selectedRowKeys: selectedMemberIds,
                onChange: setSelectedMemberIds,
                getCheckboxProps: (record) => ({
                  disabled: !currentUser || record.status === 3
                })
              }}
              columns={memberColumns}
              dataSource={members.filter(m => m.status !== 3).map(m => ({ ...m, key: m.user_id }))}
              loading={membersLoading}
              pagination={{ pageSize: 8, showSizeChanger: false }}
              locale={{ emptyText: <span style={{ color: '#94a3b8' }}>Chưa có thành viên nào hoạt động trong Mini App này.</span> }}
              style={{ background: 'transparent' }}
              className="custom-table"
              size="small"
            />
          </Card>
        )}
      </div>
    );
  }

  // STANDARD / LISTING VIEW
  return (
    <div style={{ padding: 0 }}>
      {!isFormView ? (
        <Card
          title={
            <Space>
              <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Quản lý Danh sách Mini Apps</span>
            </Space>
          }
          extra={
            <Space size="middle">
              <Input
                placeholder="Tìm kiếm theo tên/App ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: '220px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                suffix={<SearchOutlined style={{ color: '#64748b' }} onClick={handleSearch} />}
              />
              <Select
                placeholder="Lọc danh mục"
                allowClear
                value={selectedCategory}
                onChange={setSelectedCategory}
                style={{ width: '160px' }}
                dropdownStyle={{ background: '#1e293b' }}
              >
                {categories.map(c => (
                  <Option key={c.id} value={c.id}>{c.name}</Option>
                ))}
              </Select>
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
                  Tạo Mini App
                </Button>
              )}
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={fetchApps}
                loading={loading}
                style={{ background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)', color: '#a5b4fc' }}
              >
                Tải lại
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
          styles={{
            body: {
              padding: '16px',
            }
          }}
        >
          <Table
            columns={columns}
            dataSource={apps.map(a => ({ ...a, key: a.id }))}
            loading={loading}
            pagination={{ pageSize: 8, showSizeChanger: false }}
            locale={{ emptyText: <span style={{ color: '#94a3b8' }}>Không tìm thấy ứng dụng Mini App nào.</span> }}
            style={{ background: 'transparent' }}
            className="custom-table"
            size="small"
          />
        </Card>
      ) : (
        <Card
          title={
            <Space>
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/mini-apps')}
                style={{ color: '#fff', fontSize: '18px', marginRight: '4px' }}
              />
              <span style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>
                {editingApp ? 'Cập nhật Mini App' : 'Tạo mới Mini App'}
              </span>
            </Space>
          }
          bordered={false}
          style={{
            background: 'rgba(30, 41, 59, 0.65)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '5px',
            boxShadow: '0 20px 45px -15px rgba(0, 0, 0, 0.5)',
          }}
          styles={{
            body: {
              padding: '16px',
            }
          }}
        >
          <div style={{ overflowX: 'hidden' }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleModalSubmit}
              requiredMark={false}
            >
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item
                    name="name"
                    label={<span style={{ color: '#e2e8f0' }}>Tên Ứng dụng</span>}
                    rules={[{ required: true, message: 'Nhập tên ứng dụng!' }]}
                  >
                    <Input placeholder="Ví dụ: Booking App" style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="app_id"
                    label={<span style={{ color: '#e2e8f0' }}>Mã định danh (App ID)</span>}
                    rules={[
                      { required: true, message: 'Nhập mã định danh!' },
                      { pattern: /^[a-z0-9.]+$/, message: 'Chỉ chấp nhận chữ thường không dấu, số, dấu chấm!' }
                    ]}
                  >
                    <Input placeholder="Ví dụ: com.ejsc.booking" disabled={!!editingApp} style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="category_id"
                    label={<span style={{ color: '#e2e8f0' }}>Danh mục</span>}
                    rules={[{ required: true, message: 'Chọn danh mục!' }]}
                  >
                    <Select placeholder="Chọn danh mục" dropdownStyle={{ background: '#1e293b' }}>
                      {categories.map(c => (
                        <Option key={c.id} value={c.id.toString()}>{c.name}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item
                    name="version"
                    label={<span style={{ color: '#e2e8f0' }}>Phiên bản</span>}
                    rules={[{ required: true, message: 'Nhập phiên bản!' }]}
                  >
                    <Input placeholder="Ví dụ: 1.0.0" style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="url"
                    label={<span style={{ color: '#e2e8f0' }}>Đường dẫn Iframe chính (URL)</span>}
                    rules={[{ required: true, message: 'Nhập iframe URL!' }]}
                  >
                    <Input placeholder="https://yourdomain.com/booking-iframe" style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="icon_url"
                    label={<span style={{ color: '#e2e8f0' }}>Ảnh Logo (URL)</span>}
                  >
                    <Input placeholder="https://yourdomain.com/logo.png" style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item
                    name="terms_url"
                    label={<span style={{ color: '#e2e8f0' }}>Điều khoản sử dụng (URL)</span>}
                  >
                    <Input placeholder="https://yourdomain.com/terms" style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="privacy_policy_url"
                    label={<span style={{ color: '#e2e8f0' }}>Chính sách bảo mật (URL)</span>}
                  >
                    <Input placeholder="https://yourdomain.com/privacy" style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="short_description"
                    label={<span style={{ color: '#e2e8f0' }}>Mô tả ngắn gọn</span>}
                  >
                    <Input placeholder="Thông tin tóm tắt" style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={18}>
                  <Form.Item
                    name="file_path"
                    label={<span style={{ color: '#e2e8f0' }}>Đường dẫn gói Offline hiện hành (ZIP URL)</span>}
                    extra={<span style={{ color: '#64748b', fontSize: '11px' }}>Tự động đồng bộ từ bản build mới nhất được duyệt (Approved).</span>}
                  >
                    <Input 
                      disabled={true}
                      placeholder="Chưa có gói offline nào được kích hoạt" 
                      style={{ background: 'rgba(15, 23, 42, 0.4)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.06)' }} 
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    label={<span style={{ color: '#e2e8f0' }}>Tải gói Offline</span>}
                  >
                    <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.file_path !== currentValues.file_path}>
                      {({ getFieldValue }) => {
                        const filePath = getFieldValue('file_path');
                        return filePath ? (
                          <Button
                            icon={<DownloadOutlined />}
                            onClick={() => window.open(filePath, '_blank')}
                            style={{ width: '100%', background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.4)', color: '#fef08a' }}
                          >
                            Tải về (.zip)
                          </Button>
                        ) : (
                          <Button
                            disabled={true}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#64748b' }}
                          >
                            Chưa kích hoạt
                          </Button>
                        );
                      }}
                    </Form.Item>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={24}>
                  <Form.Item
                    name="description"
                    label={<span style={{ color: '#e2e8f0' }}>Mô tả chi tiết</span>}
                  >
                    <Input.TextArea placeholder="Mô tả đầy đủ của Mini App" rows={3} style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={24}>
                  <Form.Item
                    name="permissions"
                    label={<span style={{ color: '#e2e8f0' }}>Quyền truy cập (Permissions)</span>}
                  >
                    <Select
                      mode="multiple"
                      placeholder="Chọn các quyền yêu cầu..."
                      style={{ width: '100%' }}
                      dropdownStyle={{ background: '#1e293b' }}
                      options={PERMISSIONS_LIST}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12} style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '5px', marginBottom: '24px' }}>
                <Col span={8}>
                  <Form.Item
                    name="requires_auth"
                    label={<span style={{ color: '#e2e8f0' }}>Yêu cầu Auth Login</span>}
                    valuePropName="checked"
                    style={{ marginBottom: 0 }}
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="is_hidden"
                    label={<span style={{ color: '#e2e8f0' }}>Ẩn khỏi Store</span>}
                    valuePropName="checked"
                    style={{ marginBottom: 0 }}
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="is_actived"
                    label={<span style={{ color: '#e2e8f0' }}>Kích hoạt Hoạt động</span>}
                    valuePropName="checked"
                    style={{ marginBottom: 0 }}
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => navigate('/mini-apps')} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none' }}>
                    Hủy bỏ
                  </Button>
                  {editingApp ? (
                    canEdit && (
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={submitting}
                        style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none' }}
                      >
                        Lưu cập nhật
                      </Button>
                    )
                  ) : (
                    canAdd && (
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={submitting}
                        style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none' }}
                      >
                        Tạo mới
                      </Button>
                    )
                  )}
                </Space>
              </Form.Item>
            </Form>
          </div>
        </Card>
      )}

      {/* MEMBER MANAGEMENT DRAWER (Backward compatibility / Standard list fallback) */}
      <Drawer
        title={
          <div style={{ color: '#fff' }}>
            <TeamOutlined style={{ marginRight: '8px', color: '#10b981' }} />
            <span>Quản lý Thành viên - <strong>{activeApp?.name}</strong></span>
          </div>
        }
        placement="right"
        width={680}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        headerStyle={{ background: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        bodyStyle={{ background: '#0f172a', padding: '24px' }}
      >
        {/* Bulk Add Tool */}
        <div style={{ background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '5px', marginBottom: '24px' }}>
          <h4 style={{ color: '#fff', marginTop: 0, marginBottom: '12px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserAddOutlined style={{ color: '#6366f1' }} />
            Thêm Thành viên Hàng loạt (Bulk Add)
          </h4>
          <Row gutter={12} align="middle">
            <Col span={11}>
              <Select
                mode="multiple"
                allowClear
                placeholder="Chọn một hoặc nhiều tài khoản..."
                value={bulkAddUserIds}
                onChange={setBulkAddUserIds}
                style={{ width: '100%' }}
                dropdownStyle={{ background: '#1e293b' }}
                loading={membersLoading}
                optionFilterProp="children"
              >
                {candidateUsers.map(user => (
                  <Option key={user.id} value={user.id}>
                    {user.full_name || user.fullName || user.username} (@{user.username})
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={6}>
              <Select
                value={bulkAddRoleCode}
                onChange={setBulkAddRoleCode}
                style={{ width: '100%' }}
                placeholder="Chọn vai trò..."
                dropdownStyle={{ background: '#1e293b' }}
              >
                {roles.map(r => (
                  <Option key={r.code} value={r.code}>{r.name}</Option>
                ))}
              </Select>
            </Col>
            <Col span={7}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                block
                disabled={bulkAddUserIds.length === 0 || !currentUser}
                onClick={handleBulkAddMembers}
                loading={memberBulkActionLoading}
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none' }}
              >
                Thêm hàng loạt
              </Button>
            </Col>
          </Row>
        </div>

        {/* Members Table */}
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#94a3b8', fontSize: '13px' }}>
            Đã chọn: <strong style={{ color: '#6366f1' }}>{selectedMemberIds.length}</strong> thành viên
          </span>
          {selectedMemberIds.length > 0 && (
            <Space wrap>
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleBulkUpdateMemberStatus(1)}
                loading={memberBulkActionLoading}
                style={{ background: '#10b981', border: 'none' }}
              >
                Duyệt
              </Button>
              <Button
                type="primary"
                size="small"
                icon={<StopOutlined />}
                onClick={() => handleBulkUpdateMemberStatus(2)}
                loading={memberBulkActionLoading}
                style={{ background: '#f59e0b', border: 'none' }}
              >
                Khóa
              </Button>

              {roles.length > 0 && (
                <>
                  <Divider type="vertical" style={{ borderColor: 'rgba(255,255,255,0.15)' }} />
                  <span style={{ color: '#94a3b8', fontSize: '12px' }}>Gán vai trò:</span>
                  {roles.map(r => (
                    <Button
                      key={r.code}
                      size="small"
                      onClick={() => handleBulkUpdateMemberRole(r.code)}
                      loading={memberBulkActionLoading}
                      style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#a5b4fc', fontSize: '11px', borderRadius: '4px' }}
                    >
                      {r.name}
                    </Button>
                  ))}
                </>
              )}

              <Divider type="vertical" style={{ borderColor: 'rgba(255,255,255,0.15)' }} />
              <Popconfirm
                title="Xác nhận xóa hàng loạt thành viên đã chọn?"
                onConfirm={handleBulkRemoveMembers}
                okText="Xóa"
                cancelText="Hủy"
              >
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  loading={memberBulkActionLoading}
                >
                  Xóa
                </Button>
              </Popconfirm>
            </Space>
          )}
        </div>

        <Table
          rowSelection={{
            selectedRowKeys: selectedMemberIds,
            onChange: setSelectedMemberIds,
            getCheckboxProps: (record) => ({
              disabled: !currentUser || record.status === 3
            })
          }}
          columns={memberColumns}
          dataSource={members.filter(m => m.status !== 3).map(m => ({ ...m, key: m.user_id }))}
          loading={membersLoading}
          pagination={{ pageSize: 6, showSizeChanger: false }}
          locale={{ emptyText: <span style={{ color: '#94a3b8' }}>Chưa có thành viên nào hoạt động trong Mini App này.</span> }}
          style={{ background: 'transparent' }}
          className="custom-table"
          size="small"
        />
      </Drawer>
    </div>
  );
}
