import { useTranslation } from 'react-i18next'
import styles from './PromotionOverlay.module.css'

type Props = {
	playerColor: 'w' | 'b'
	getPieceImageSrc: (type: string, color: 'w' | 'b') => string
	pieceNames: Record<string, string>
	onSelect: (pieceCode: string) => void
}

function PromotionOverlay({ playerColor, getPieceImageSrc, pieceNames, onSelect }: Props) {
	const { t } = useTranslation()

	return (
		<div className={styles.promotionOverlay}>
			<div className={styles.promotionBox}>
				<h4>{t('promote_pawn', 'Promote Pawn')}</h4>
				<div className={styles.promotionOptions}>
					{(['q', 'r', 'b', 'n'] as const).map(code => (
						<button
							key={code}
							className={styles.promotionOption}
							onClick={() => onSelect(code)}
						>
							<img
								src={getPieceImageSrc(code, playerColor)}
								alt={pieceNames[code]}
								className={styles.promotionPieceIcon}
							/>
						</button>
					))}
				</div>
			</div>
		</div>
	)
}

export default PromotionOverlay