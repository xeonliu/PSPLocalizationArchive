import { useState, useEffect } from 'react'
import { Table, Input, Select, Space, Tag, Card, Row, Col, Statistic, List, Typography } from 'antd'
import { SearchOutlined, FilterOutlined } from '@ant-design/icons'
import { Link, useSearchParams } from 'react-router-dom'
import { Game, loadGames, loadGroups, filterGames } from '../data'
import { useMediaQuery } from 'react-responsive'

const { Search } = Input

const GameList = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  
  const searchText = searchParams.get('search') || ''
  const languageFilter = searchParams.get('lang') || 'all'
  const groupFilter = searchParams.get('group') || 'all'
  const currentPage = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('size') || '20', 10)

  const [filteredGames, setFilteredGames] = useState<Game[]>([])
  const [allGroups, setAllGroups] = useState<{ id: string; name: string }[]>([])
  const [groupMap, setGroupMap] = useState<Map<string, string>>(new Map())

  const isMobile = useMediaQuery({ maxWidth: 768 })

  const updateSearchParams = (updates: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === 'all' || (key === 'page' && value === '1') || (key === 'size' && value === '20')) {
        newParams.delete(key)
      } else {
        newParams.set(key, value)
      }
    })
    setSearchParams(newParams)
  }

  useEffect(() => {
    const init = async () => {
      const [loadedGames, groups] = await Promise.all([loadGames(), loadGroups()])
      setGames(loadedGames)
      
      const gMap = new Map<string, string>()
      groups.forEach(g => gMap.set(g.id, g.name))
      setGroupMap(gMap)

      // 提取游戏中出现的所有汉化组 ID，并附加上真实的汉化组名称
      const groupIds = new Set<string>()
      loadedGames.forEach(game => {
        game.localizations?.forEach(loc => {
          if (loc.group_id) groupIds.add(loc.group_id)
        })
      })
      const gameGroups = Array.from(groupIds).map(id => ({
        id,
        name: gMap.get(id) || id
      }))
      setAllGroups(gameGroups)
      
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    const filtered = filterGames(games, {
      search: searchText,
      language: languageFilter,
      group: groupFilter,
    })
    setFilteredGames(filtered)
  }, [games, searchText, languageFilter, groupFilter])

  const getLanguages = (game: Game) => {
    return game.localizations?.map(loc => loc.lang).filter((v, i, a) => a.indexOf(v) === i) || []
  }

  const getGroups = (game: Game) => {
    return game.localizations?.map(loc => loc.group_id).filter((v, i, a) => a.indexOf(v) === i) || []
  }

  const getVersions = (game: Game) => {
    return game.localizations?.map(loc => loc.version).filter(Boolean) as string[] || []
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: string) => (
        <Link to={`/game/${id}`} style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {id}
        </Link>
      ),
    },
    {
      title: '游戏名称',
      dataIndex: 'titles',
      key: 'title',
      render: (titles: Game['titles'], record: Game) => (
        <div>
          <Link to={`/game/${record.id}`}>{titles.zh_cn || titles.native}</Link>
        </div>
      ),
    },
    {
      title: '原名',
      dataIndex: ['titles', 'native'],
      key: 'native',
      width: 180,
      ellipsis: true,
    },
    {
      title: '语言',
      key: 'language',
      width: 100,
      render: (_: unknown, record: Game) => (
        <>
          {getLanguages(record).map(lang => (
            <Tag key={lang} color={lang === 'zh-Hans' ? 'green' : 'orange'}>
              {lang === 'zh-Hans' ? '简体' : lang === 'zh-Hant' ? '繁体' : lang}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: '汉化组',
      key: 'groups',
      render: (_: unknown, record: Game) => (
        <Space wrap>
          {getGroups(record).map(g => (
            <Link key={g} to={`/groups/${g}`}>
              <Tag color="purple">
                {groupMap.get(g) || g}
              </Tag>
            </Link>
          ))}
        </Space>
      ),
    },
    {
      title: '版本',
      key: 'version',
      width: 100,
      render: (_: unknown, record: Game) => {
        const versions = getVersions(record);
        return versions.length > 0 ? versions[0] : '-';
      },
    },
    {
      title: '开发商',
      dataIndex: 'developer',
      key: 'developer',
      width: 120,
      ellipsis: true,
    },
  ]

  return (
    <div className="game-list">
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="游戏总数"
              value={games.length}
              valueStyle={{ color: '#c41a1a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="简体中文"
              value={games.filter(g => getLanguages(g).includes('zh-Hans')).length}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="繁体中文"
              value={games.filter(g => getLanguages(g).includes('zh-Hant')).length}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="汉化组数量"
              value={allGroups.length}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <FilterOutlined />
            筛选条件
          </Space>
        }
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Space wrap>
          <Search
            placeholder="搜索游戏名称、ID..."
            allowClear
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
            value={searchText}
            onSearch={val => updateSearchParams({ search: val, page: '1' })}
            onChange={e => updateSearchParams({ search: e.target.value, page: '1' })}
          />
          <Select
            value={languageFilter}
            onChange={val => updateSearchParams({ lang: val, page: '1' })}
            style={{ width: 120 }}
            options={[
              { value: 'all', label: '全部语言' },
              { value: 'zh-Hans', label: '简体中文' },
              { value: 'zh-Hant', label: '繁体中文' },
            ]}
          />
          <Select
            value={groupFilter}
            onChange={val => updateSearchParams({ group: val, page: '1' })}
            style={{ width: 180 }}
            showSearch
            allowClear
            placeholder="选择汉化组"
            options={[
              { value: 'all', label: '全部汉化组' },
              ...allGroups.map(g => ({ value: g.id, label: g.name })),
            ]}
          />
        </Space>
      </Card>

      <Card title={`搜索结果: ${filteredGames.length} 个游戏`} size="small">
        {isMobile ? (
          <List
            loading={loading}
            dataSource={filteredGames}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 个游戏`,
              onChange: (page, size) => updateSearchParams({ page: page.toString(), size: size.toString() }),
            }}
            renderItem={(game) => (
              <List.Item>
                <Card size="small" style={{ width: '100%', marginBottom: 8 }}>
                  <Typography.Title level={5} style={{ marginTop: 0 }}>
                    <Link to={`/game/${game.id}`}>
                      {game.titles.zh_cn || game.titles.native}
                    </Link>
                  </Typography.Title>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space wrap>
                      <Tag color="blue">{game.id}</Tag>
                      {getGroups(game).map(g => (
                        <Link key={g} to={`/groups/${g}`}>
                          <Tag color="purple">{groupMap.get(g) || g}</Tag>
                        </Link>
                      ))}
                    </Space>
                    <Space wrap>
                      {getLanguages(game).map(l => <Tag key={l}>{l}</Tag>)}
                      <span style={{ color: '#888', fontSize: '12px' }}>
                        版本: {getVersions(game).join(', ') || '未知'}
                      </span>
                    </Space>
                  </Space>
                </Card>
              </List.Item>
            )}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredGames}
            rowKey="id"
            loading={loading}
            size="small"
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 个游戏`,
              onChange: (page, size) => updateSearchParams({ page: page.toString(), size: size.toString() }),
            }}
            scroll={{ x: 1000 }}
          />
        )}
      </Card>
    </div>
  )
}

export default GameList
