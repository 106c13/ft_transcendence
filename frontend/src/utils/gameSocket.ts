import io, { Socket } from 'socket.io-client'

let socketInstance: Socket | null = null
let currentSocketUserId: string | null = null

export function getGameSocket(userId: number | string): Socket {
    const uid = userId.toString()
    if (!socketInstance || !socketInstance.connected || currentSocketUserId !== uid) {
        if (socketInstance) {
            socketInstance.disconnect()
        }
        currentSocketUserId = uid
        socketInstance = io('/game', {
            query: { userId: uid },
            transports: ['websocket', 'polling'],
        })
    }
    return socketInstance
}

export function disconnectGameSocket(): void {
    if (socketInstance) {
        socketInstance.disconnect()
        socketInstance = null
        currentSocketUserId = null
    }
}
