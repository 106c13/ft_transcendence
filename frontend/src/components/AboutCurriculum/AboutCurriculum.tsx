import { GraduationCap, Zap, Brain, ShieldCheck, Server } from 'lucide-react';
import styles from './AboutCurriculum.module.css';

const AboutCurriculum = () => {
	return (
		<section className={styles.curriculumCard}>
			<h2 className={styles.sectionTitle}>
				<GraduationCap size={22} aria-hidden="true" />
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
						<Zap size={16} aria-hidden="true" />
						<span>Core Gameplay</span>
					</div>
					<p className={styles.techItemDesc}>
						Full chess rule-set, move validation, clock management, premoves, and live WebSocket matchmaking.
					</p>
				</div>

				<div className={styles.techItem}>
					<div className={styles.techItemTitle}>
						<Brain size={16} aria-hidden="true" />
						<span>Game Analysis & ELO</span>
					</div>
					<p className={styles.techItemDesc}>
						Integrated Stockfish engine, centipawn evaluations, brilliant move detection, and dynamic leaderboards.
					</p>
				</div>

				<div className={styles.techItem}>
					<div className={styles.techItemTitle}>
						<ShieldCheck size={16} aria-hidden="true" />
						<span>Auth, Chat & i18n</span>
					</div>
					<p className={styles.techItemDesc}>
						JWT authentication, 2FA, instant messaging rooms, real-time notifications, and trilingual support.
					</p>
				</div>

				<div className={styles.techItem}>
					<div className={styles.techItemTitle}>
						<Server size={16} aria-hidden="true" />
						<span>Infrastructure</span>
					</div>
					<p className={styles.techItemDesc}>
						Fully dockerized microservices with NestJS, PostgreSQL, Nginx, and React 19 single-page architecture.
					</p>
				</div>
			</div>
		</section>
	);
};

export default AboutCurriculum;
