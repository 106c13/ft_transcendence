import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { getPieceImageSrc, PIECE_NAME } from '../../utils/gameUtils';
import styles from './PromotionOverlay.module.css';

type Props = {
	playerColor: 'w' | 'b';
	square?: string | null;
	ranks?: string[] ;
	files?: string[];
	onSelect: (pieceCode: string) => void;
	onCancel: () => void;
};

const PromotionOverlay = ({
	playerColor,
	square,
	ranks,
	files,
	onSelect,
	onCancel,
}: Props) => {
	const { t } = useTranslation()

	const colIdx = square && files ? files.indexOf(square[0]) : 3
	const rowIdx = square && ranks ? ranks.indexOf(square[1]) : 0

	const safeCol = colIdx >= 0 ? colIdx : 3
	const safeRow = rowIdx >= 0 ? rowIdx : 0

	const isTopRank = safeRow <= 3

	const positionStyle: React.CSSProperties = {
		left: `calc(${safeCol * 12.5}% + 6.25%)`,
		transform: 'translateX(-50%)',
		...(isTopRank
			? { top: `calc(${safeRow * 12.5}% + 8px)` }
			: { bottom: `calc(${(7 - safeRow) * 12.5}% + 8px)` }),
	}

	return (
		<>
			<div
				className={styles.transparentBackdrop}
				onClick={onCancel}
				onContextMenu={e => {
					e.preventDefault()
					e.stopPropagation()
					onCancel()
				}}
			/>

			<div
				className={styles.miniPromotionBox}
				style={positionStyle}
				onContextMenu={e => {
					e.preventDefault()
					e.stopPropagation()
					onCancel()
				}}
			>
				<button
					type="button"
					className={styles.closeBtn}
					onClick={e => {
						e.stopPropagation();
						onCancel();
					}}
					aria-label={t('cancel')}
					title={t('cancel')}
				>
					<X size={12} aria-hidden="true" />
				</button>

				<div className={styles.pieceOptionsColumn}>
					{(['q', 'r', 'b', 'n'] as const).map(code => (
						<button
							key={code}
							type="button"
							className={styles.pieceOptionBtn}
							onClick={e => {
								e.stopPropagation()
								onSelect(code)
							}}
							title={t(PIECE_NAME[code].toLowerCase(), PIECE_NAME[code])}
						>
							<img
								src={getPieceImageSrc(code, playerColor)}
								alt={t(PIECE_NAME[code].toLowerCase(), PIECE_NAME[code])}
								className={styles.pieceImg}
							/>
						</button>
					))}
				</div>
			</div>
		</>
	);
};

export default PromotionOverlay;