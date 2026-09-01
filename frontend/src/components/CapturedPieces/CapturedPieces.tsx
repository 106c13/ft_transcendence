import { useTranslation } from 'react-i18next'
import { getPieceImageSrc, PIECE_NAME } from '../../constants/gameConstants'
import styles from './CapturedPieces.module.css'

type PieceCapture = { type: string; color: 'w' | 'b' }

type Props = {
	captured: { w: PieceCapture[]; b: PieceCapture[] }
	whiteScore: number
	blackScore: number
	playerColor: 'w' | 'b'
}

function CapturedPieces({ captured, whiteScore, blackScore, playerColor }: Props) {
	const { t } = useTranslation()

	return (
		<div className={styles.capturedContainer}>
			<span className={styles.capturedLabel}>{t('captured_by_you', 'Captured by You')}</span>
			<div className={styles.capturedList}>
				{(playerColor === 'w' ? captured.b : captured.w).map((p, idx) => (
					<img
						key={idx}
						src={getPieceImageSrc(p.type, p.color)}
						alt={PIECE_NAME[p.type]}
						className={`${styles.capturedPiece} ${p.color === 'w' ? styles.white : styles.black}`}
					/>
				))}
				{playerColor === 'w' && whiteScore > blackScore && (
					<span className={styles.materialDiff}>+{whiteScore - blackScore}</span>
				)}
				{playerColor === 'b' && blackScore > whiteScore && (
					<span className={styles.materialDiff}>+{blackScore - whiteScore}</span>
				)}
			</div>

			<span className={styles.capturedLabel} style={{ marginTop: '10px' }}>
				{t('captured_by_opponent', 'Captured by Opponent')}
			</span>
			<div className={styles.capturedList}>
				{(playerColor === 'w' ? captured.w : captured.b).map((p, idx) => (
					<img
						key={idx}
						src={getPieceImageSrc(p.type, p.color)}
						alt={PIECE_NAME[p.type]}
						className={`${styles.capturedPiece} ${p.color === 'w' ? styles.white : styles.black}`}
					/>
				))}
				{playerColor === 'w' && blackScore > whiteScore && (
					<span className={styles.materialDiff}>+{blackScore - whiteScore}</span>
				)}
				{playerColor === 'b' && whiteScore > blackScore && (
					<span className={styles.materialDiff}>+{whiteScore - blackScore}</span>
				)}
			</div>
		</div>
	)
}

export default CapturedPieces
