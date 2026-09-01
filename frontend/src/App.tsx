import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'
import Login from './pages/LoginPage/Login'
import Register from './pages/RegisterPage/Register'
import Profile from './pages/ProfilePage/Profile'
import Settings from './pages/SettingsPage/Settings'
import NotFound from './pages/NotFoundPage/NotFound'
import Home from './pages/HomePage/Home'
import Chat from './pages/ChatPage/Chat'
import Game from './pages/GamePage/Game'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* Guest Auth Layout */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Authenticated Layout */}
        <Route element={<MainLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/settings" element={<Settings />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:user_id" element={<Chat />} />
          <Route path="/game" element={<Game />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}