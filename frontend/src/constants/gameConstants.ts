const PIECE_ASSET_DIR = '/assets/pieces'

export const getPieceImageSrc = (type: string, color: 'w' | 'b'): string => {
    return `${PIECE_ASSET_DIR}/${color}${type.toUpperCase()}.svg`
}

export const PIECE_NAME: Record<string, string> = {
    p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King',
}
