import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Card, Tag, Typography, Spin, Descriptions, Breadcrumb, Space, Alert, Table, Tree } from 'antd'
import type { DataNode } from 'antd/es/tree'
import { HomeOutlined, ArrowLeftOutlined, FolderOutlined, FileOutlined } from '@ant-design/icons'
import { Game, loadGameById, loadGroups } from '../data'
import type { Localization, FileNode } from '../data'

const { Title } = Typography

const GameDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [game, setGame] = useState<Game | null>(null)
  const [groups, setGroups] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      if (!id) return
      const loadedGame = await loadGameById(id)
      setGame(loadedGame)

      const loadedGroups = await loadGroups()
      const groupMap = new Map<string, string>()
      loadedGroups.forEach((g, k) => groupMap.set(k, g.name))
      setGroups(groupMap)

      setLoading(false)
    }
    init()
  }, [id])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!game) {
    return (
      <Alert
        message="未找到游戏"
        description={`无法找到 ID 为 ${id} 的游戏`}
        type="error"
        showIcon
      />
    )
  }

  // 辅助函数：将扁平的文件路径列表转换为 Ant Design Tree 组件所需的嵌套结构
  const buildFileTree = (files: FileNode[]): DataNode[] => {
    const root: DataNode[] = [];
    const map = new Map<string, DataNode>();

    files.forEach((file) => {
      const parts = file.path.split('/').filter(Boolean);
      let currentPath = '';

      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!map.has(currentPath)) {
          const node: DataNode = {
            title: isLast ? (
              <Space>
                <span>{part}</span>
                <span style={{ color: '#888', fontSize: '12px' }}>
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
                <span style={{ color: '#bfbfbf', fontSize: '12px', marginLeft: '8px' }}>
                  {file.mtime}
                </span>
                {file.modified && <Tag color="blue" style={{ margin: 0, lineHeight: '14px' }}>修改</Tag>}
              </Space>
            ) : (
              part
            ),
            key: currentPath,
            icon: isLast ? <FileOutlined /> : <FolderOutlined />,
            isLeaf: isLast,
            children: [],
          };
          map.set(currentPath, node);

          if (parentPath === '') {
            root.push(node);
          } else {
            const parentNode = map.get(parentPath);
            if (parentNode && parentNode.children) {
              parentNode.children.push(node);
            }
          }
        }
      });
    });

    return root;
  };

  const expandedRowRender = (record: Localization) => {
    if (!record.files || record.files.length === 0) {
      return <div style={{ padding: '8px 16px', color: '#888' }}>暂无文件树信息</div>;
    }

    const treeData = buildFileTree(record.files);
    
    return (
      <div style={{ padding: '8px 16px', backgroundColor: '#fafafa', borderRadius: '4px' }}>
        <Typography.Text strong style={{ display: 'block', marginBottom: '8px' }}>
          镜像文件结构 (共 {record.files.length} 个文件)
        </Typography.Text>
        <div style={{ maxHeight: '300px', overflowY: 'auto', backgroundColor: '#fff', padding: '8px', border: '1px solid #f0f0f0' }}>
          <Tree
            showIcon
            defaultExpandAll={false}
            treeData={treeData}
            selectable={false}
          />
        </div>
      </div>
    );
  };

  const localizationColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 120 },
    { title: '语言', dataIndex: 'lang', key: 'lang', width: 80 },
    {
      title: '汉化组',
      dataIndex: 'group_id',
      key: 'group_id',
      width: 150,
      render: (groupId: string) => <Link to={`/groups/${groupId}`}><Tag color="purple">{groups.get(groupId) || groupId}</Tag></Link>,
    },
    { title: '版本', dataIndex: 'version', key: 'version', width: 100 },
    { title: '发布日期', dataIndex: 'release_date', key: 'release_date', width: 120 },
    {
      title: '技术指标',
      key: 'tech',
      width: 200,
      render: (_: unknown, record: Localization) => (
        <Space size="small" wrap>
          {record.tech_stats.psn_base && <Tag color="blue">PSN版</Tag>}
          {record.tech_stats.media_install_compatible && <Tag color="green">媒体安装</Tag>}
          {record.tech_stats.cheat_code_support && <Tag color="orange">金手指</Tag>}
        </Space>
      ),
    },
    {
      title: '备注',
      key: 'notes',
      width: 250,
      render: (_: unknown, record: Localization) => (
        record.notes && record.notes.length > 0 ? (
          <Space direction="vertical" size={0}>
            {record.notes.map((note, idx) => (
              <Typography.Text key={idx} type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                • {note}
              </Typography.Text>
            ))}
          </Space>
        ) : '-'
      ),
    },
  ]

  const releaseColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 100 },
    { title: 'Catalog', dataIndex: 'catalog_id', key: 'catalog_id', width: 120 },
    { title: '标题', dataIndex: 'title', key: 'title', width: 200 },
    { title: '地区', dataIndex: 'region', key: 'region', width: 80 },
    { title: '版本', dataIndex: 'version', key: 'version', width: 80 },
    { title: '介质', dataIndex: 'media', key: 'media', width: 80 },
    { title: '大小', dataIndex: 'size', key: 'size', width: 120 },
  ]

  return (
    <div className="game-detail" style={{ padding: 24 }}>
      <Breadcrumb
        items={[
          { title: <Link to="/"><HomeOutlined /> 首页</Link> },
          { title: <Link to="/">游戏列表</Link> },
          { title: game.titles.zh_cn || game.titles.native },
        ]}
        style={{ marginBottom: 16 }}
      />

      <Title level={3} style={{ marginBottom: 16 }}>
        {game.titles.zh_cn || game.titles.native}
      </Title>

      <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="ID">{game.id}</Descriptions.Item>
          <Descriptions.Item label="开发商">{game.developer || '-'}</Descriptions.Item>
          <Descriptions.Item label="中文名称" span={2}>{game.titles.zh_cn || '-'}</Descriptions.Item>
          <Descriptions.Item label="原名称" span={2}>{game.titles.native}</Descriptions.Item>
          <Descriptions.Item label="英文名称">{game.titles.en || '-'}</Descriptions.Item>
          <Descriptions.Item label="类型">{game.genres?.join(', ') || '-'}</Descriptions.Item>
          <Descriptions.Item label="标签">{game.tags?.map(t => <Tag key={t}>{t}</Tag>)}</Descriptions.Item>
          <Descriptions.Item label="外部链接" span={2}>
            {game.external_links ? (
              <Space>
                {game.external_links.vndb && <Tag>VNDB: {game.external_links.vndb}</Tag>}
                {game.external_links.igdb && <Tag>IGDB: {game.external_links.igdb}</Tag>}
                {game.external_links.redump_index && <Tag>Redump: {game.external_links.redump_index}</Tag>}
              </Space>
            ) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="描述" span={2}>{game.description || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={`官方发行版 (${game.releases?.length || 0})`} size="small" style={{ marginBottom: 16 }}>
        <Table
          columns={releaseColumns}
          dataSource={game.releases || []}
          rowKey="id"
          size="small"
          pagination={false}
          locale={{ emptyText: '暂无官方发行版信息' }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Card title={`汉化版本 (${game.localizations?.length || 0})`} size="small">
        <Table
          columns={localizationColumns}
          dataSource={game.localizations || []}
          rowKey="id"
          size="small"
          pagination={false}
          expandable={{
            expandedRowRender,
            rowExpandable: (record) => !!record.files && record.files.length > 0,
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <div style={{ marginTop: 16 }}>
        <a onClick={(e) => { e.preventDefault(); navigate(-1); }} style={{ cursor: 'pointer' }}>
          <Space><ArrowLeftOutlined />返回</Space>
        </a>
      </div>
    </div>
  )
}

export default GameDetail
