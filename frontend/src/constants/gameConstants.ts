const PIECE_ASSET_DIR = '/assets/pieces'

export const getPieceImageSrc = (type: string, color: 'w' | 'b'): string => {
    return `${PIECE_ASSET_DIR}/${color}${type.toUpperCase()}.svg`
}

export const PIECE_NAME: Record<string, string> = {
    p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King',
}

export const getAvatarUrl = (avatar?: string | null): string => {
    if (!avatar || avatar === 'default.jpg') return '/assets/default.jpg'
    if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('/')) return avatar
    return `/uploads/${avatar}`
}

export const getModeColor = (mode?: string): string => {
    if (!mode) return '#38BDF8'
    const lower = mode.toLowerCase()
    if (lower.includes('bullet')) return '#F59E0B'
    if (lower.includes('blitz')) return '#38BDF8'
    if (lower.includes('rapid')) return '#818CF8'
    return '#38BDF8'
}
