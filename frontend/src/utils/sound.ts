export type SoundType =
    | 'game-start'
    | 'game-end'
    | 'move-self'
    | 'move-opponent'
    | 'capture'
    | 'move-check'
    | 'castle'
    | 'promote'
    | 'premove'
    | 'drawoffer'
    | 'tenseconds'
    | 'illegal'

const SOUND_SRC: Record<SoundType, string> = {
    'game-start': '/assets/sounds/game-start.mp3',
    'game-end': '/assets/sounds/game-end.mp3',
    'move-self': '/assets/sounds/move-self.mp3',
    'move-opponent': '/assets/sounds/move-opponent.mp3',
    'capture': '/assets/sounds/capture.mp3',
    'move-check': '/assets/sounds/move-check.mp3',
    'castle': '/assets/sounds/castle.mp3',
    'promote': '/assets/sounds/promote.mp3',
    'premove': '/assets/sounds/premove.mp3',
    'drawoffer': '/assets/sounds/drawoffer.mp3',
    'tenseconds': '/assets/sounds/tenseconds.mp3',
    'illegal': '/assets/sounds/illegal.mp3',
}

const audioCache = new Map<SoundType, HTMLAudioElement>()

// Preload audio instances for immediate playback
if (typeof window !== 'undefined') {
    ;(Object.keys(SOUND_SRC) as SoundType[]).forEach(type => {
        const audio = new Audio(SOUND_SRC[type])
        audio.preload = 'auto'
        audioCache.set(type, audio)
    })
}

export function playSound(type: SoundType) {
    if (typeof window === 'undefined') return
    try {
        const audio = audioCache.get(type)
        if (audio) {
            audio.currentTime = 0
            audio.play().catch(() => {
                // Silently handle browser autoplay policy before initial user interaction
            })
        }
    } catch {
        // Safe failover
    }
}
