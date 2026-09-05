import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'
import LoginPage from './pages/LoginPage/LoginPage'
import RegisterPage from './pages/RegisterPage/RegisterPage'
import ProfilePage from './pages/ProfilePage/ProfilePage'
import SettingsPage from './pages/SettingsPage/SettingsPage'
import NotFoundPage from './pages/NotFoundPage/NotFoundPage'
import HomePage from './pages/HomePage/HomePage'
import ChatPage from './pages/ChatPage/ChatPage'
import GamePage from './pages/GamePage/GamePage'
import GameAnalysisPage from './pages/GameAnalysisPage/GameAnalysisPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* Guest Auth Layout */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Authenticated Layout */}
        <Route element={<MainLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/settings" element={<SettingsPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/profile/:username/games" element={<ProfilePage defaultTab="games" />} />
          <Route path="/profile/:username/analysis/:id" element={<GameAnalysisPage />} />
          <Route path="/profile/:username/games/:id" element={<GameAnalysisPage />} />
          <Route path="/game/analysis/:id" element={<GameAnalysisPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:user_id" element={<ChatPage />} />
          <Route path="/game" element={<GamePage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}