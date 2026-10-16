import { Gem, Sparkles, CheckCheck, BookOpen } from 'lucide-react'
import styles from './MoveClassificationIcon.module.css'

const STAR = (
	<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<polygon points="12,3.2 14.4,9.1 20.6,9.6 15.7,13.6 17.3,19.6 12,16.2 6.7,19.6 8.3,13.6 3.4,9.6 9.6,9.1" />
	</svg>
)

type Props = {
    classification: string;
    withBackground?: boolean;
    size?: number;
    className?: string;
}

const MoveClassificationIcon = ({ classification, withBackground = false, size = 34, className }: Props) => {
	const icon = (() => {
		switch (classification) {
		case 'brilliant':
			return <Gem aria-hidden="true" strokeWidth={2.4} />
		case 'great':
			return <Sparkles aria-hidden="true" strokeWidth={2.4} />
		case 'best':
			return STAR
		case 'excellent':
			return <CheckCheck aria-hidden="true" strokeWidth={2.8} />
		case 'good':
			return (
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2"
					strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
					<polyline points="20 6.5 9 17.5 4 12.5" />
				</svg>
			)
		case 'inaccuracy':
			return (
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
					strokeLinecap="round" aria-hidden="true">
					<line x1="12" y1="5.2" x2="12" y2="13.5" />
					<circle cx="12" cy="18" r="1.5" fill="currentColor" stroke="none" />
				</svg>
			)
		case 'mistake':
			return (
				<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path d="M12 4.2L3.2 19.5h17.6L12 4.2z" fill="currentColor" />
					<line x1="12" y1="9.8" x2="12" y2="14.2" stroke="#F97316" strokeWidth="2.4" strokeLinecap="round" />
					<circle cx="12" cy="17.2" r="1.1" fill="#F97316" />
				</svg>
			)
		case 'blunder':
			return (
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
					strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
					<path d="M8.8 8.8a3.4 3.4 0 0 1 6.4 1.2c0 2-3.2 2.8-3.2 4.5" />
					<circle cx="12" cy="18" r="1.5" fill="currentColor" stroke="none" />
				</svg>
			)
		case 'book':
			return <BookOpen aria-hidden="true" strokeWidth={2.4} />
		default:
			return STAR
		}
	})()

	if (!withBackground) {
		return (
			<span className={`${styles.iconOnly} ${className ?? ''}`} style={{ width: size, height: size }}>
				{icon}
			</span>
		)
	}

	return (
		<span
			className={`${styles.iconBackground} ${styles[`icon_${classification}`]}`}
			style={{
				width: size,
				height: size,
				padding: Math.max(2, Math.round(size * 0.2)),
			}}
		>
			{icon}
		</span>
	)
};

export default MoveClassificationIcon;