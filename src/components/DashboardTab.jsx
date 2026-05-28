import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Badge, Table, Button, Spin, Tag, Tooltip, Empty } from 'antd';
import { 
  AppstoreOutlined, 
  TagsOutlined, 
  TeamOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  SyncOutlined,
  BranchesOutlined
} from '@ant-design/icons';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Pie, Column } from '@ant-design/plots';

export default function DashboardTab() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard');
      setStats(res.data);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" tip="Đang tải dữ liệu tổng quan..." style={{ color: '#6366f1' }} />
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Empty description="Không thể tải dữ liệu thống kê. Vui lòng kiểm tra lại kết nối!" />
        <Button type="primary" onClick={fetchStats} style={{ marginTop: '16px' }}>Thử lại</Button>
      </div>
    );
  }

  const { kpis, categoryDistribution, buildStatusDistribution, permissionDistribution, recentBuilds, recentApps } = stats;

  // Formatting date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Build status tag helper
  const getBuildStatusTag = (status) => {
    switch (status) {
      case 1:
        return <Tag color="warning" style={{ margin: 0 }}>Chờ duyệt</Tag>;
      case 2:
        return <Tag color="success" style={{ margin: 0 }}>Đã duyệt</Tag>;
      case 3:
        return <Tag color="error" style={{ margin: 0 }}>Từ chối</Tag>;
      default:
        return <Tag color="default" style={{ margin: 0 }}>Không rõ</Tag>;
    }
  };

  // Plots config
  const categoryConfig = {
    data: categoryDistribution,
    angleField: 'count',
    colorField: 'name',
    radius: 0.8,
    innerRadius: 0.5,
    theme: 'dark',
    legend: {
      color: {
        position: 'bottom',
        rowPadding: 5,
        layout: 'horizontal',
      },
    },
    label: {
      text: 'count',
      style: {
        fontWeight: 'bold',
      },
    },
  };

  const permissionConfig = {
    data: permissionDistribution,
    xField: 'name',
    yField: 'count',
    theme: 'dark',
    style: {
      fill: '#6366f1',
      maxWidth: 32,
      radius: [4, 4, 0, 0],
    },
    label: {
      text: 'count',
      position: 'inside',
    },
  };

  // Build review status donut chart config
  const statusLabels = {
    1: 'Chờ duyệt',
    2: 'Đã duyệt',
    3: 'Từ chối'
  };

  const buildStatusData = buildStatusDistribution.map(item => ({
    name: statusLabels[item.status] || `Trạng thái ${item.status}`,
    count: item.count
  }));

  const buildStatusConfig = {
    data: buildStatusData,
    angleField: 'count',
    colorField: 'name',
    radius: 0.8,
    innerRadius: 0.5,
    theme: 'dark',
    legend: {
      color: {
        position: 'bottom',
        rowPadding: 5,
        layout: 'horizontal',
      },
    },
    label: {
      text: 'count',
      style: {
        fontWeight: 'bold',
      },
    },
  };

  return (
    <div style={{ padding: '0', color: '#f8fafc', minHeight: '100%' }}>
      {/* Header Title with Refresh Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 750, margin: 0, letterSpacing: '-0.5px' }}>
            Tổng quan hệ thống
          </h1>
          <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0 0' }}>
            Báo cáo thống kê quy mô & hoạt động của Mini App Center
          </p>
        </div>
        <Button 
          type="text" 
          icon={<SyncOutlined />} 
          onClick={fetchStats}
          style={{ 
            color: '#a5b4fc', 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '5px' 
          }}
        >
          Làm mới
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            bordered={false}
            style={{ 
              background: 'rgba(30, 41, 59, 0.45)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '8px'
            }}
          >
            <Statistic
              title={<span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>Tổng ứng dụng</span>}
              value={kpis.totalApps}
              valueStyle={{ color: '#fff', fontWeight: 700, fontSize: '24px' }}
              prefix={<AppstoreOutlined style={{ color: '#6366f1', marginRight: '8px' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            bordered={false}
            style={{ 
              background: 'rgba(30, 41, 59, 0.45)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '8px'
            }}
          >
            <Statistic
              title={<span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>Đang hoạt động</span>}
              value={kpis.activeApps}
              valueStyle={{ color: '#fff', fontWeight: 700, fontSize: '24px' }}
              prefix={<CheckCircleOutlined style={{ color: '#10b981', marginRight: '8px' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            bordered={false}
            style={{ 
              background: 'rgba(30, 41, 59, 0.45)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              position: 'relative'
            }}
          >
            <Statistic
              title={<span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>Bản build chờ duyệt</span>}
              value={kpis.pendingBuilds}
              valueStyle={{ color: kpis.pendingBuilds > 0 ? '#fbbf24' : '#fff', fontWeight: 700, fontSize: '24px' }}
              prefix={<ClockCircleOutlined style={{ color: kpis.pendingBuilds > 0 ? '#fbbf24' : '#94a3b8', marginRight: '8px' }} />}
            />
            {kpis.pendingBuilds > 0 && (
              <Badge status="processing" style={{ position: 'absolute', top: '16px', right: '16px' }} />
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            bordered={false}
            style={{ 
              background: 'rgba(30, 41, 59, 0.45)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '8px'
            }}
          >
            <Statistic
              title={<span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>Tổng thành viên</span>}
              value={kpis.totalUsers}
              valueStyle={{ color: '#fff', fontWeight: 700, fontSize: '24px' }}
              prefix={<TeamOutlined style={{ color: '#3b82f6', marginRight: '8px' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Distribution Charts Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {/* Category distribution */}
        <Col xs={24} md={12} xl={8}>
          <Card
            title={<span style={{ color: '#fff', fontWeight: 650, fontSize: '14px' }}>Phân bố ứng dụng theo Danh mục</span>}
            bordered={false}
            style={{ 
              background: 'rgba(30, 41, 59, 0.45)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              height: '100%'
            }}
          >
            {categoryDistribution.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu danh mục" />
            ) : (
              <div style={{ height: '260px' }}>
                <Pie {...categoryConfig} />
              </div>
            )}
          </Card>
        </Col>

        {/* Build Status Ratio */}
        <Col xs={24} md={12} xl={8}>
          <Card
            title={<span style={{ color: '#fff', fontWeight: 650, fontSize: '14px' }}>Tỷ lệ Trạng thái duyệt bản Build</span>}
            bordered={false}
            style={{ 
              background: 'rgba(30, 41, 59, 0.45)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              height: '100%'
            }}
          >
            {buildStatusDistribution.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu lịch sử duyệt" />
            ) : (
              <div style={{ height: '260px' }}>
                <Pie {...buildStatusConfig} />
              </div>
            )}
          </Card>
        </Col>

        {/* Permissions distribution */}
        <Col xs={24} md={24} xl={8}>
          <Card
            title={<span style={{ color: '#fff', fontWeight: 650, fontSize: '14px' }}>Yêu cầu quyền truy cập nhiều nhất</span>}
            bordered={false}
            style={{ 
              background: 'rgba(30, 41, 59, 0.45)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              height: '100%'
            }}
          >
            {permissionDistribution.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu phân quyền" />
            ) : (
              <div style={{ height: '260px' }}>
                <Column {...permissionConfig} />
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Activity Logs / Table list Row */}
      <Row gutter={[16, 16]}>
        {/* Recent Builds Table */}
        <Col xs={24} xl={15}>
          <Card
            title={<span style={{ color: '#fff', fontWeight: 650, fontSize: '14px' }}>Lịch sử cập nhật phiên bản gần đây</span>}
            bordered={false}
            style={{ 
              background: 'rgba(30, 41, 59, 0.45)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '8px'
            }}
            bodyStyle={{ padding: '12px 16px' }}
          >
            <Table
              className="custom-table"
              dataSource={recentBuilds}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Ứng dụng',
                  dataIndex: 'app_name',
                  key: 'app_name',
                  render: (text) => <span style={{ fontWeight: 600, color: '#f8fafc' }}>{text}</span>
                },
                {
                  title: 'Bản build',
                  dataIndex: 'version',
                  key: 'version',
                  width: 90,
                  render: (v) => <code style={{ color: '#6366f1' }}>v{v}</code>
                },
                {
                  title: 'Ngày cập nhật',
                  dataIndex: 'created_at',
                  key: 'created_at',
                  render: (d) => <span style={{ color: '#94a3b8' }}>{formatDate(d)}</span>
                },
                {
                  title: 'Trạng thái',
                  dataIndex: 'status',
                  key: 'status',
                  width: 110,
                  render: (status) => getBuildStatusTag(status)
                }
              ]}
              locale={{ emptyText: 'Chưa có bản build nào được tải lên.' }}
            />
          </Card>
        </Col>

        {/* Recently Added Mini Apps */}
        <Col xs={24} xl={9}>
          <Card
            title={<span style={{ color: '#fff', fontWeight: 650, fontSize: '14px' }}>Ứng dụng mới tham gia</span>}
            bordered={false}
            style={{ 
              background: 'rgba(30, 41, 59, 0.45)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              height: '100%'
            }}
            bodyStyle={{ padding: '12px 20px' }}
          >
            {recentApps.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có ứng dụng nào" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentApps.map((app) => (
                  <div 
                    key={app.id} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      paddingBottom: '12px',
                      borderBottom: '1px solid rgba(255,255,255,0.03)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '13px' }}>{app.name}</div>
                      <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                        Tạo lúc: {formatDate(app.created_at)}
                      </div>
                    </div>
                    <Tag color="cyan" style={{ fontFamily: 'monospace', margin: 0 }}>v{app.version}</Tag>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
