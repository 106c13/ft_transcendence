import React, { useEffect, useState } from 'react'
import io, { Socket } from 'socket.io-client'
import { GameSocketContext } from './GameSocketContext'

export interface GameSocketProviderProps {
    children: React.ReactNode
    userId?: number | string | null
}

export function GameSocketProvider({ children, userId }: GameSocketProviderProps) {
    const [socket, setSocket] = useState<Socket | null>(null)
    const [isConnected, setIsConnected] = useState(false)

    useEffect(() => {
        if (!userId) {
            setSocket(null)
            setIsConnected(false)
            return
        }

        const uid = userId.toString()
        const newSocket = io('/game', {
            query: { userId: uid },
            transports: ['websocket', 'polling'],
        })

        const handleConnect = () => {
            setIsConnected(true)
        }

        const handleDisconnect = () => {
            setIsConnected(false)
        }

        newSocket.on('connect', handleConnect)
        newSocket.on('disconnect', handleDisconnect)

        setSocket(newSocket)
        setIsConnected(newSocket.connected)

        return () => {
            newSocket.off('connect', handleConnect)
            newSocket.off('disconnect', handleDisconnect)
            newSocket.disconnect()
            setSocket(null)
            setIsConnected(false)
        }
    }, [userId])

    return (
        <GameSocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </GameSocketContext.Provider>
    )
}
