import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Card, Badge, Tooltip, message, Popconfirm, Modal, Form, Input } from 'antd';
import { ReloadOutlined, SettingOutlined, PlusOutlined, DeleteOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function CategoryTab({ currentUser }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/mini-app-groups?isChildren=true');
      const rawGroups = res.data || res;
      // Rename children to childApps to prevent Ant Design Table default tree rendering
      const mappedGroups = (Array.isArray(rawGroups) ? rawGroups : []).map(g => {
        const { children, ...rest } = g;
        return {
          ...rest,
          childApps: children || []
        };
      });
      setGroups(mappedGroups);
    } catch (err) {
      message.error('Không thể tải dữ liệu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleManageGroup = async (record) => {
    setLoading(true);
    try {
      const res = await api.get(`/mini-apps/app-id/${record.parent_app_id}`);
      const parentApp = res.data || res;
      if (parentApp && parentApp.id) {
        navigate(`/mini-apps/${parentApp.id}/manage`);
      } else {
        message.error('Không tìm thấy thông tin Mini App cha tương ứng.');
      }
    } catch (err) {
      message.error('Không thể tìm thấy Mini App cha: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = (groupRecord) => {
    setSelectedGroup(groupRecord);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleAddChildAppSubmit = async (values) => {
    setSubmitting(true);
    try {
      const routerPath = values.router;

      // 1. Fetch parent app details to clone
      const parentRes = await api.get(`/mini-apps/app-id/${selectedGroup.parent_app_id}`);
      const parentApp = parentRes.data || parentRes;
      if (!parentApp) {
        throw new Error("Không tìm thấy thông tin App cha.");
      }

      // 2. Derive suffix & name from router path
      let suffix = routerPath.replace(/^\/+/, '').replace(/\/+$/, '');
      if (!suffix) {
        throw new Error("Đường dẫn router không hợp lệ.");
      }

      const name = suffix
        .split(/[-_.]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      const childAppId = `${parentApp.app_id}.${suffix}`;

      // 3. Register child app
      const payload = {
        app_id: childAppId,
        name: name,
        category_id: parentApp.category_id,
        url: routerPath,
        icon_url: parentApp.icon_url || '',
        version: parentApp.version || '1.0.0',
        requires_auth: parentApp.requires_auth || false,
        permissions: parentApp.permissions || [],
        file_path: parentApp.file_path || '',
        file_hash: parentApp.file_hash || '',
        file_checksum: parentApp.file_checksum || '',
        policy: parentApp.policy || {},
        is_hidden: false,
        is_actived: true
      };

      await api.post('/mini-apps', payload);
      message.success(`Khai báo Mini App con "${name}" thành công!`);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      message.error('Không thể thêm App con: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChildDelete = async (childId) => {
    setLoading(true);
    try {
      await api.delete(`/mini-apps/${childId}`);
      message.success('Xóa Mini App con thành công!');
      fetchData();
    } catch (err) {
      message.error('Không thể xóa Mini App con: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '#ID',
      dataIndex: 'mapping_id',
      key: 'mapping_id',
      width: 100,
    },
    {
      title: 'Tên Nhóm',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span style={{ fontWeight: 600, color: '#f8fafc' }}>{text}</span>,
    },
    {
      title: 'Số lượng App con',
      dataIndex: 'childApps',
      key: 'children_count',
      render: (childApps) => <Badge count={childApps?.length || 0} style={{ backgroundColor: '#6366f1' }} />,
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 200,
      render: (_, record) => {
        return (
          <Space size="middle">
            <Button
              type="primary"
              icon={<SettingOutlined />}
              onClick={() => handleManageGroup(record)}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                fontWeight: 600,
                borderRadius: '4px'
              }}
            >
              Cấu hình Nhóm
            </Button>
          </Space>
        );
      },
    },
  ];

  // Render child apps table when expanding a group row
  const expandedRowRender = (record) => {
    const childColumns = [
      {
        title: 'Tên App con',
        dataIndex: 'name',
        key: 'name',
        render: (text) => <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{text}</span>
      },
      {
        title: 'App ID con',
        dataIndex: 'app_id',
        key: 'app_id',
        render: (text) => <code style={{ color: '#ec4899', background: 'rgba(236,72,153,0.08)', padding: '2px 6px', borderRadius: '5px' }}>{text}</code>
      },
      {
        title: 'Đường dẫn Router',
        dataIndex: 'url',
        key: 'url',
        render: (text) => <span style={{ color: '#cbd5e1', fontFamily: 'monospace' }}>{text}</span>
      },
      {
        title: 'Thao tác',
        key: 'actions',
        width: 100,
        render: (_, childRecord) => (
          <Popconfirm
            title="Xác nhận xóa Mini App con này?"
            description="Ứng dụng con sẽ bị gỡ khỏi hệ thống nhóm."
            onConfirm={() => handleChildDelete(childRecord.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        )
      }
    ];

    return (
      <div style={{ padding: '8px 16px', background: 'rgba(15, 23, 42, 0.2)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ color: '#a5b4fc', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FolderOpenOutlined /> Danh sách Mini App con của nhóm "{record.name}"
          </span>
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => handleOpenAddModal(record)}
            style={{ background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)', color: '#a5b4fc', fontWeight: 600 }}
          >
            Thêm Mini App con
          </Button>
        </div>
        <Table
          columns={childColumns}
          dataSource={(record.childApps || []).map(c => ({ ...c, key: c.id }))}
          pagination={false}
          size="small"
          locale={{ emptyText: <span style={{ color: '#64748b' }}>Chưa có ứng dụng con nào được khai báo.</span> }}
          style={{ background: 'transparent' }}
          className="custom-table"
        />
      </div>
    );
  };

  return (
    <div>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Quản lý Nhóm Mini App</span>
          </div>
        }
        extra={
          <Space>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={fetchData}
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
          dataSource={groups.map(g => ({ ...g, key: g.mapping_id }))}
          loading={loading}
          expandable={{
            expandedRowRender,
            rowExpandable: () => true,
          }}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          locale={{ emptyText: <span style={{ color: '#94a3b8' }}>Không có nhóm nào được định nghĩa.</span> }}
          style={{ background: 'transparent' }}
          className="custom-table"
          size="small"
        />
      </Card>

      <Modal
        title={
          <span style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>
            Thêm Mini App con vào nhóm "{selectedGroup?.name}"
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
          onFinish={handleAddChildAppSubmit}
          requiredMark={false}
        >
          <Form.Item
            name="router"
            label={<span style={{ color: '#e2e8f0' }}>Đường dẫn Router / URL của App con</span>}
            extra={<span style={{ color: '#64748b', fontSize: '11px' }}>Hệ thống sẽ tự động tạo tên hiển thị và App ID dựa trên đường dẫn này. Ví dụ: /bookings hoặc /address-book</span>}
            rules={[
              { required: true, message: 'Vui lòng nhập đường dẫn Router!' },
              { pattern: /^\/[a-zA-Z0-9-_/]+$/, message: 'Đường dẫn phải bắt đầu bằng dấu gạch chéo (/), ví dụ: /profile' }
            ]}
          >
            <Input
              placeholder="Ví dụ: /profile hoặc /address-book"
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
                Khai báo
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
