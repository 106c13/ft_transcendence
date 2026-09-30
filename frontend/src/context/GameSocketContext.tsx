import { createContext, useContext } from 'react'
import type { Socket } from 'socket.io-client'

export interface GameSocketContextValue {
    socket: Socket | null
    isConnected: boolean
}

export const GameSocketContext = createContext<GameSocketContextValue | null>(null)

export function useGameSocketContext(): GameSocketContextValue {
    const context = useContext(GameSocketContext)
    if (!context) {
        throw new Error('useGameSocketContext must be used within a GameSocketProvider')
    }
    return context
}
