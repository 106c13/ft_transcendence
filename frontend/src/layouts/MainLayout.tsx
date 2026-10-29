import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar/Navbar'
import Footer from '../components/Footer/Footer'
import ChallengeNotification from '../components/ChallengeNotification/ChallengeNotification'
import { useChallengeSocket } from '../hooks/useChallengeSocket'
import { useToast } from '../context/ToastContext'

import type { User } from '../utils/profileUtils'
import type { LayoutContextType } from '../utils/layoutContextUtils'
import { useFriends } from '../hooks/useFriends'
export type { User, LayoutContextType };

export default function MainLayout() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('token')
  const isPublicRoute = location.pathname === '/about' || location.pathname.startsWith('/analyze')

  useEffect(() => {
    if (!token) {
      if (!isPublicRoute) {
        navigate('/login')
      }
      return
    }

    fetch('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized')
        return res.json()
      })
      .then((data) => setCurrentUser(data))
      .catch(() => {
        localStorage.removeItem('token')
        if (!isPublicRoute) {
          navigate('/login')
        }
      })
  }, [navigate, token, isPublicRoute])

  const challengeSocket = useChallengeSocket(currentUser?.id)
  const { incomingChallenge, acceptChallenge, declineChallenge } = challengeSocket
  const { setTopSlot } = useToast()

  const friendSocket = useFriends(currentUser)

  useEffect(() => {
    if (incomingChallenge) {
      setTopSlot(
        <ChallengeNotification
          key={incomingChallenge.challengeId}
          challenge={incomingChallenge}
          onAccept={acceptChallenge}
          onDecline={declineChallenge}
        />
      )
    } else {
      setTopSlot(null)
    }
  }, [incomingChallenge, acceptChallenge, declineChallenge, setTopSlot])

  // Clear topSlot on unmount of MainLayout
  useEffect(() => {
    return () => {
      setTopSlot(null)
    }
  }, [setTopSlot])

  if (!currentUser && !isPublicRoute) {
    return null
  }

  const isChatRoute = location.pathname.startsWith('/chat')
  const isGameRoute = location.pathname.startsWith('/game') && !location.pathname.startsWith('/game/analysis')
  const isAnalyzeRoute = location.pathname.startsWith('/analyze') || location.pathname.startsWith('/game/analysis')
  const showFooter = !isChatRoute && !isGameRoute && !isAnalyzeRoute

  return (
    <div className="app-layout">
      <Navbar currentUser={currentUser} friendSocket={friendSocket} />
      <main className="layout-body">
        {/* Child routes render here */}
        <Outlet context={{ currentUser, setCurrentUser, challengeSocket, friendSocket } satisfies LayoutContextType} />
      </main>
      {showFooter && <Footer currentUser={currentUser} />}
    </div>
  )
}