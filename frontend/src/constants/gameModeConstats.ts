import styles from '../components/GameMode/GameMode.module.css'

export type GameModeType = 'bullet' | 'blitz' | 'rapid' | 'bullet+2' | 'blitz+2' | 'rapid+2'

export const modeClassMap: Record<GameModeType, keyof typeof styles> = {
	'bullet': 'homeModeBullet',
	'bullet+2': 'homeModeBulletInc',
	'blitz': 'homeModeBlitz',
	'blitz+2': 'homeModeBlitzInc',
	'rapid': 'homeModeRapid',
	'rapid+2': 'homeModeRapidInc',
}

export type ModeItem = {
	id: GameModeType
	emoji: string
	label: string
	time: string
	desc: string
	increment?: string
}
