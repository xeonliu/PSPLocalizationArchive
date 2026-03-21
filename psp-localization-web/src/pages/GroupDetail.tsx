import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, Typography, Spin, Descriptions, Breadcrumb, Alert, Table, Tag, Space } from 'antd'
import { HomeOutlined, TeamOutlined, ArrowLeftOutlined, GlobalOutlined } from '@ant-design/icons'
import { Group, Game, loadGroupById, loadGames } from '../data'

const { Title } = Typography

const GroupDetail = () => {
  const { id } = useParams<{ id: string }>()
  const [group, setGroup] = useState<Group | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      if (!id) return
      
      const loadedGroup = await loadGroupById(id)
      setGroup(loadedGroup)

      if (loadedGroup) {
        // 查找该汉化组参与的所有游戏
        const allGames = await loadGames()
        const groupGames = allGames.filter(game => 
          game.localizations?.some(loc => loc.group_id === id)
        )
        setGames(groupGames)
      }

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

  if (!group) {
    return (
      <Alert
        message="未找到汉化组"
        description={`无法找到 ID 为 ${id} 的汉化组`}
        type="error"
        showIcon
      />
    )
  }

  const columns = [
    {
      title: '游戏ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id: string) => <Tag>{id}</Tag>,
    },
    {
      title: '游戏名称',
      key: 'name',
      render: (_: unknown, record: Game) => (
        <Link to={`/game/${record.id}`}>
          {record.titles.zh_cn || record.titles.native}
        </Link>
      ),
    },
    {
      title: '参与版本',
      key: 'versions',
      render: (_: unknown, record: Game) => {
        const locs = record.localizations?.filter(loc => loc.group_id === id) || []
        return (
          <Space wrap>
            {locs.map(loc => (
              <Tag key={loc.id} color="blue">
                {loc.version || '未知版本'} ({loc.lang})
              </Tag>
            ))}
          </Space>
        )
      },
    },
    {
      title: '发布日期',
      key: 'release_date',
      width: 150,
      render: (_: unknown, record: Game) => {
        const locs = record.localizations?.filter(loc => loc.group_id === id) || []
        // 取最早的发布日期展示
        const dates = locs.map(loc => loc.release_date).filter(Boolean) as string[]
        if (dates.length === 0) return '-'
        return dates.sort()[0]
      },
    }
  ]

  return (
    <div style={{ padding: 24 }}>
      <Breadcrumb
        items={[
          { title: <Link to="/"><HomeOutlined /> 首页</Link> },
          { title: <Link to="/groups"><TeamOutlined /> 汉化组列表</Link> },
          { title: group.name || id },
        ]}
        style={{ marginBottom: 16 }}
      />

      <Title level={3} style={{ marginBottom: 16 }}>
        {group.name} <span style={{ fontSize: '16px', color: '#888', fontWeight: 'normal' }}>({id})</span>
      </Title>

      <Card title="基本信息" size="small" style={{ marginBottom: 24 }}>
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="名称">{group.name}</Descriptions.Item>
          <Descriptions.Item label="状态">
            {group.status === 'active' ? <Tag color="success">活跃</Tag> : 
             group.status === 'inactive' ? <Tag color="default">不活跃</Tag> : 
             group.status || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="创立时间">{group.founded || '-'}</Descriptions.Item>
          <Descriptions.Item label="官方网站">
            {group.website ? (
              <a href={group.website} target="_blank" rel="noopener noreferrer">
                <Space><GlobalOutlined /> 访问网站</Space>
              </a>
            ) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="描述" span={2}>
            {group.description || '暂无描述'}
          </Descriptions.Item>
          {group.archives && group.archives.length > 0 && (
            <Descriptions.Item label="相关存档" span={2}>
              <Space wrap>
                {group.archives.map((archive, index) => (
                  <a key={index} href={archive.url} target="_blank" rel="noopener noreferrer">
                    <Tag icon={<GlobalOutlined />} color="cyan">{archive.label}</Tag>
                  </a>
                ))}
              </Space>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card title={`汉化作品 (${games.length})`} size="small">
        <Table
          columns={columns}
          dataSource={games}
          rowKey="id"
          pagination={{ pageSize: 20 }}
          locale={{ emptyText: '暂无汉化作品记录' }}
        />
      </Card>

      <div style={{ marginTop: 16 }}>
        <Link to="/groups">
          <Space><ArrowLeftOutlined />返回汉化组列表</Space>
        </Link>
      </div>
    </div>
  )
}

export default GroupDetail