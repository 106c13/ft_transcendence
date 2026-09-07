import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar/Navbar'
import ChallengeNotification from '../components/ChallengeNotification/ChallengeNotification'
import { useChallengeSocket } from '../hooks/useChallengeSocket'
import type { ChallengeStatus, ChallengeReceived } from '../hooks/useChallengeSocket'

export type User = {
  id: number
  username: string
  email: string
  avatar?: string
  bio?: string
  status?: 'ONLINE' | 'OFFLINE' | 'INGAME'
}

export type LayoutContextType = {
  currentUser: User | null
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>
  challengeSocket: {
    challengeStatus: ChallengeStatus
    challengeError: string
    incomingChallenge: ChallengeReceived | null
    challengeCountdown: number
    sendChallenge: (friendUsername: string, mode: string) => void
    acceptChallenge: (challengeId: string) => void
    declineChallenge: (challengeId: string) => void
    resetChallengeStatus: () => void
  }
}

export default function MainLayout() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!token) {
      navigate('/login')
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
        navigate('/login')
      })
  }, [navigate, token])

  const challengeSocket = useChallengeSocket(currentUser?.id)

  if (!currentUser) {
    return <div className="layout-loading">Loading...</div>
  }

  return (
    <div className="app-layout">
      <Navbar currentUser={currentUser} />
      <main className="layout-body">
        {/* Child routes render here */}
        <Outlet context={{ currentUser, setCurrentUser, challengeSocket } satisfies LayoutContextType} />
      </main>

      {/* Floating challenge notification */}
      {challengeSocket.incomingChallenge && (
        <ChallengeNotification
          challenge={challengeSocket.incomingChallenge}
          countdown={challengeSocket.challengeCountdown}
          onAccept={challengeSocket.acceptChallenge}
          onDecline={challengeSocket.declineChallenge}
        />
      )}
    </div>
  )
}