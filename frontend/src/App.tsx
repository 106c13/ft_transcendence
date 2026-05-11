import {
	BrowserRouter,
	Routes,
	Route,
	Navigate
} from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import Home	from './pages/Home'
import Chat from './pages/Chat'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
		<Route path="/profile/settings" element={<Settings />} />
		<Route path="/profile/:username" element={<Profile />} />

		<Route path="/home" element={<Home />} />

		<Route path="/chat" element={<Chat />} />

		<Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
