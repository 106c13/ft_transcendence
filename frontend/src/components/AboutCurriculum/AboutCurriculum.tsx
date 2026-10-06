import styles from './AboutCurriculum.module.css'

export default function AboutCurriculum() {
	return (
		<section className={styles.curriculumCard}>
			<h2 className={styles.sectionTitle}>
				<span>♟</span>
				<span>About the 42 Curriculum & ft_transcendence</span>
			</h2>

			<p className={styles.curriculumText}>
				<strong>ft_transcendence</strong> is the final capstone project of the 42 Common Core curriculum.
				It challenges students to build a full-fledged, real-time multiplayer web application from scratch,
				requiring comprehensive mastery over containerized microservices, high-frequency bidirectional WebSockets,
				cryptographic security standards, and responsive user experience without relying on turnkey full-stack starter templates.
			</p>

			<div className={styles.techStackGrid}>
				<div className={styles.techItem}>
					<div className={styles.techItemTitle}>
						<span>⚡</span> Core Gameplay
					</div>
					<p className={styles.techItemDesc}>
						Full chess rule-set, move validation, clock management, premoves, and live WebSocket matchmaking.
					</p>
				</div>

				<div className={styles.techItem}>
					<div className={styles.techItemTitle}>
						<span>🧠</span> Game Analysis & ELO
					</div>
					<p className={styles.techItemDesc}>
						Integrated Stockfish engine, centipawn evaluations, brilliant move detection, and dynamic leaderboards.
					</p>
				</div>

				<div className={styles.techItem}>
					<div className={styles.techItemTitle}>
						<span>🛡️</span> Auth, Chat & i18n
					</div>
					<p className={styles.techItemDesc}>
						JWT authentication, 2FA, instant messaging rooms, real-time notifications, and trilingual support.
					</p>
				</div>

				<div className={styles.techItem}>
					<div className={styles.techItemTitle}>
						<span>🐳</span> Infrastructure
					</div>
					<p className={styles.techItemDesc}>
						Fully dockerized microservices with NestJS, PostgreSQL, Nginx, and React 19 single-page architecture.
					</p>
				</div>
			</div>
		</section>
	)
}
