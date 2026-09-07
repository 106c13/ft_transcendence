import { useTranslation } from 'react-i18next'
import type { ChallengeStatus } from '../../hooks/useChallengeSocket'
import styles from './ChallengeSection.module.css'

type Friend = {
	username: string
	avatar: string | null
}

type Props = {
	active: boolean
	onToggle: () => void
	selectedFriend: string
	onSelectFriend: (username: string) => void
	friends: Friend[]
	challengeStatus: ChallengeStatus
	challengeError: string
}

function ChallengeSection({
	active, onToggle, selectedFriend, onSelectFriend,
	friends, challengeStatus, challengeError
}: Props) {
	const { t } = useTranslation()

	const getStatusMessage = () => {
		switch (challengeStatus) {
			case 'sending':
				return t('challenge_sending', 'Sending challenge...')
			case 'sent':
				return t('challenge_sent', 'Challenge sent! Waiting for response...')
			case 'accepted':
				return t('challenge_accepted', 'Challenge accepted! Starting game...')
			case 'declined':
				return t('challenge_declined', 'Challenge was declined.')
			case 'expired':
				return t('challenge_expired', 'Challenge expired. No response received.')
			case 'error':
				return challengeError || t('challenge_error', 'Failed to send challenge.')
			default:
				return null
		}
	}

	const statusMessage = getStatusMessage()
	const statusClass = challengeStatus === 'accepted' ? styles.statusSuccess
		: challengeStatus === 'declined' || challengeStatus === 'expired' || challengeStatus === 'error' ? styles.statusError
		: challengeStatus === 'sent' || challengeStatus === 'sending' ? styles.statusPending
		: ''

	return (
		<div className={styles.challengeSection}>
			<div className={styles.challengeRow}>
				<button
					className={`${styles.challengeToggle} ${active ? styles.challengeToggleActive : ''}`}
					onClick={onToggle}
				>
					<span className={styles.challengeIcon}>⚔️</span>
					{t('challenge_friend', 'Challenge a Friend')}
				</button>

				<div className={`${styles.friendSelectWrapper} ${active ? styles.friendSelectActive : ''}`}>
					<select
						className={styles.friendSelect}
						value={selectedFriend}
						onChange={(e) => onSelectFriend(e.target.value)}
						disabled={!active}
					>
						<option value="">{t('select_friend', '— Select a friend —')}</option>
						{friends.map(friend => (
							<option key={friend.username} value={friend.username}>
								{friend.username}
							</option>
						))}
					</select>
				</div>
			</div>

			{active && friends.length === 0 && (
				<div className={styles.noFriendsMsg}>
					{t('no_friends_to_challenge', 'You don\'t have any friends yet. Add friends to challenge them!')}
				</div>
			)}

			{statusMessage && (
				<div className={`${styles.statusMessage} ${statusClass}`}>
					{statusMessage}
				</div>
			)}

			{active && !selectedFriend && challengeStatus === 'idle' && friends.length > 0 && (
				<div className={styles.hintMessage}>
					{t('challenge_hint', 'Select a friend, then click a game mode above to send a challenge')}
				</div>
			)}
		</div>
	)
}

export default ChallengeSection
