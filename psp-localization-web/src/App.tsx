import { Routes, Route, Link } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import { HomeOutlined, SearchOutlined, TeamOutlined } from '@ant-design/icons'
import GameList from './pages/GameList'
import GameDetail from './pages/GameDetail'
import Groups from './pages/Groups'
import GroupDetail from './pages/GroupDetail'
import './App.css'

const { Header, Content } = Layout

function App() {
  return (
    <Layout className="app-layout">
      <Header className="header">
        <div className="logo">
          <Link to="/">PSP 汉化档案库</Link>
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['1']}
          className="top-menu"
          items={[
            {
              key: '1',
              icon: <HomeOutlined />,
              label: <Link to="/">游戏列表</Link>,
            },
            {
              key: '2',
              icon: <SearchOutlined />,
              label: <Link to="/">搜索</Link>,
            },
            {
              key: '3',
              icon: <TeamOutlined />,
              label: <Link to="/groups">汉化组</Link>,
            },
          ]}
        />
      </Header>
      <Content className="content">
        <Routes>
          <Route path="/" element={<GameList />} />
          <Route path="/game/:id" element={<GameDetail />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/groups/:id" element={<GroupDetail />} />
        </Routes>
      </Content>
    </Layout>
  )
}

export default App