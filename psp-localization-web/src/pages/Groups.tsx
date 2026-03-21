import { useState, useEffect } from 'react'
import { Table, Card, Input, Space, Tag, Row, Col, Statistic } from 'antd'
import { TeamOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { Group, loadGroups } from '../data'

const { Search } = Input

const Groups = () => {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    const init = async () => {
      const loadedGroups = await loadGroups()
      setGroups(Array.from(loadedGroups.values()))
      setLoading(false)
    }
    init()
  }, [])

  const filteredGroups = groups.filter(group => {
    if (!searchText) return true
    const lower = searchText.toLowerCase()
    return (
      group.id.toLowerCase().includes(lower) ||
      group.name.toLowerCase().includes(lower) ||
      group.description?.toLowerCase().includes(lower)
    )
  })

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id: string) => <Tag>{id}</Tag>,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Group) => (
        <Link to={`/groups/${record.id}`}>{name}</Link>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => status || '-',
    },
    {
      title: '创立时间',
      dataIndex: 'founded',
      key: 'founded',
      width: 100,
      render: (founded: number) => founded || '-',
    },
    {
      title: '网站',
      dataIndex: 'website',
      key: 'website',
      width: 150,
      render: (website: string) =>
        website ? (
          <a href={website} target="_blank" rel="noopener noreferrer">
            访问
          </a>
        ) : (
          '-'
        ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <TeamOutlined />
            汉化组列表
          </Space>
        }
        extra={
          <Search
            placeholder="搜索汉化组..."
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 200 }}
          />
        }
      >
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic title="总汉化组数" value={groups.length} />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredGroups}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  )
}

export default Groups
