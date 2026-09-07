import { useState, useRef, useEffect } from 'react'
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
	const [isOpen, setIsOpen] = useState(false)
	const dropdownRef = useRef<HTMLDivElement>(null)

	// Close dropdown when active toggles off
	useEffect(() => {
		if (!active) {
			setIsOpen(false)
		}
	}, [active])

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false)
			}
		}

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside)
		}
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isOpen])

	const selectedFriendObj = friends.find(f => f.username === selectedFriend)

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
					type="button"
					className={`${styles.challengeToggle} ${active ? styles.challengeToggleActive : ''}`}
					onClick={onToggle}
				>
					<span className={styles.challengeIcon}>⚔️</span>
					{t('challenge_friend', 'Challenge a Friend')}
				</button>

				<div
					ref={dropdownRef}
					className={`${styles.friendSelectWrapper} ${active ? styles.friendSelectActive : ''}`}
				>
					<button
						type="button"
						className={`${styles.friendSelectTrigger} ${isOpen ? styles.triggerOpen : ''}`}
						onClick={() => active && setIsOpen(!isOpen)}
						disabled={!active}
					>
						<div className={styles.triggerContent}>
							{selectedFriendObj ? (
								<>
									<img
										src={selectedFriendObj.avatar ? `/uploads/${selectedFriendObj.avatar}` : '/assets/default.jpg'}
										alt={selectedFriendObj.username}
										className={styles.triggerAvatar}
									/>
									<span className={styles.triggerSelectedName}>{selectedFriendObj.username}</span>
								</>
							) : (
								<>
									<span className={styles.triggerPlaceholderIcon}>👤</span>
									<span className={styles.triggerPlaceholderText}>
										{t('select_friend', '— Select a friend —')}
									</span>
								</>
							)}
						</div>
						<svg
							className={`${styles.dropdownChevron} ${isOpen ? styles.chevronRotated : ''}`}
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<polyline points="6 9 12 15 18 9" />
						</svg>
					</button>

					{isOpen && active && (
						<div className={styles.dropdownMenu}>
							{selectedFriend && (
								<div
									className={styles.dropdownClearOption}
									onClick={() => {
										onSelectFriend('')
										setIsOpen(false)
									}}
								>
									<span className={styles.clearIcon}>✕</span>
									<span>{t('deselect_friend', '— Deselect friend —')}</span>
								</div>
							)}

							{friends.length === 0 ? (
								<div className={styles.emptyOptions}>
									{t('no_friends_available', 'No friends found')}
								</div>
							) : (
								friends.map(friend => {
									const isSelected = friend.username === selectedFriend
									return (
										<div
											key={friend.username}
											className={`${styles.dropdownOption} ${isSelected ? styles.optionSelected : ''}`}
											onClick={() => {
												onSelectFriend(friend.username)
												setIsOpen(false)
											}}
										>
											<img
												src={friend.avatar ? `/uploads/${friend.avatar}` : '/assets/default.jpg'}
												alt={friend.username}
												className={styles.optionAvatar}
											/>
											<span className={styles.optionUsername}>{friend.username}</span>
											{isSelected && <span className={styles.optionCheck}>✓</span>}
										</div>
									)
								})
							)}
						</div>
					)}
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
					{t('challenge_hint', 'Select a friend, then click a game mode below to send a challenge')}
				</div>
			)}
		</div>
	)
}

export default ChallengeSection
