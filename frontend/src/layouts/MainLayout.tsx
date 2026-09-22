import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar/Navbar'
import ChallengeNotification from '../components/ChallengeNotification/ChallengeNotification'
import { useChallengeSocket } from '../hooks/useChallengeSocket'
import type { ChallengeStatus, ChallengeReceived, ChallengeSent } from '../hooks/useChallengeSocket'
import { useToast } from '../context/ToastContext'

import type { User } from '../constants/profileConstants'
export type { User }

export type LayoutContextType = {
  currentUser: User | null
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>
  challengeSocket: {
    challengeStatus: ChallengeStatus
    challengeError: string
    incomingChallenge: ChallengeReceived | null
    outgoingChallenge: ChallengeSent | null
    challengeCountdown: number
    incomingCountdown: number
    outgoingCountdown: number
    sendChallenge: (friendUsername: string, mode: string) => void
    acceptChallenge: (challengeId: string) => void
    declineChallenge: (challengeId: string) => void
    resetChallengeStatus: () => void
  }
}

export default function MainLayout() {
  const { t } = useTranslation()
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
  const { incomingChallenge, acceptChallenge, declineChallenge } = challengeSocket
  const { setTopSlot } = useToast()

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

  if (!currentUser) {
    return <div className="layout-loading">{t('loading')}</div>
  }

  return (
    <div className="app-layout">
      <Navbar currentUser={currentUser} />
      <main className="layout-body">
        {/* Child routes render here */}
        <Outlet context={{ currentUser, setCurrentUser, challengeSocket } satisfies LayoutContextType} />
      </main>
    </div>
  )
}