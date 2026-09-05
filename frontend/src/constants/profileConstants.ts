export type TabType = 'overview' | 'games' | 'friends'

export type User = {
    id: number
    username: string
    email: string
    avatar?: string
    bio?: string
    created_at?: string
    status?: string
    isOwnProfile?: boolean
}

export type FriendStatus =
    | 'NONE'
    | 'PENDING'
    | 'ACCEPTED'
    | 'RECEIVED'
    | 'SENT'
