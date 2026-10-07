import { useTranslation } from 'react-i18next';
import styles from './LeaderboardPagination.module.css';

interface LeaderboardPaginationProps {
	page: number;
	totalPages: number;
	total: number;
	onPageChange: (page: number) => void;
}

const LeaderboardPagination = ({
	page,
	totalPages,
	total,
	onPageChange,
}: LeaderboardPaginationProps) => {
	const { t } = useTranslation();

	if (total === 0) return null;

	const safePage = Math.min(Math.max(1, page), Math.max(1, totalPages));
	const fromIndex = (safePage - 1) * 30 + 1;
	const toIndex = Math.min(safePage * 30, total);

	return (
		<div className={styles.paginationBar}>
			<div className={styles.paginationInfo}>
				{t('showing_players', {
					from: fromIndex,
					to: toIndex,
					total,
				})}
			</div>

			{totalPages > 1 && (
				<div className={styles.paginationControls}>
					<button
						className={styles.pageBtn}
						disabled={safePage <= 1}
						onClick={(e) => {
							e.currentTarget.blur();
							onPageChange(Math.max(1, safePage - 1));
						}}
						type="button"
					>
						{t('previous')}
					</button>

					{Array.from({ length: totalPages }, (_, i) => i + 1)
						.filter((p) => {
							return (
								p === 1 ||
								p === totalPages ||
								Math.abs(p - safePage) <= 2
							);
						})
						.map((p, index, array) => {
							const prev = array[index - 1];
							const showEllipsis = prev && p - prev > 1;

							return (
								<span key={p} style={{ display: 'inline-flex', alignItems: 'center' }}>
									{showEllipsis && <span className={styles.ellipsis}>...</span>}
									<button
										className={`${styles.pageBtn} ${
											p === safePage ? styles.activePageBtn : ''
										}`}
										onClick={(e) => {
											e.currentTarget.blur();
											onPageChange(p);
										}}
										type="button"
									>
										{p}
									</button>
								</span>
							);
						})}

					<button
						className={styles.pageBtn}
						disabled={safePage >= totalPages}
						onClick={(e) => {
							e.currentTarget.blur();
							onPageChange(Math.min(totalPages, safePage + 1));
						}}
						type="button"
					>
						{t('next')}
					</button>
				</div>
			)}
		</div>
	);
};

export default LeaderboardPagination;
