import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
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
}

function ChallengeSection({
	active, onToggle, selectedFriend, onSelectFriend,
	friends
}: Props) {
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [openUpwards, setOpenUpwards] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false)
				setSearchQuery('')
				setOpenUpwards(false)
			}
		}

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside)
		}
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isOpen])

	const handleToggleDropdown = () => {
		if (!active) return

		if (!isOpen && dropdownRef.current) {
			const rect = dropdownRef.current.getBoundingClientRect()
			const spaceBellow = window.innerHeight - rect.bottom
			const dropdownEstHeight = 290

			setOpenUpwards(spaceBellow < dropdownEstHeight && rect.top > dropdownEstHeight)
			setIsOpen(true)
		} else {
			setIsOpen(false)
			setSearchQuery('')
			setOpenUpwards(false)
		}
	}

	const handleToggle = () => {
		setIsOpen(false)
		setSearchQuery('')
		setOpenUpwards(false)
		onToggle()
	}

	const handleSelect = (username: string) => {
		onSelectFriend(username)
		setIsOpen(false)
		setSearchQuery('')
		setOpenUpwards(false)
	}

	const selectedFriendObj = friends.find(f => f.username === selectedFriend)

	const filteredFriends = friends.filter(f =>
		f.username.toLocaleLowerCase().includes(searchQuery.trim().toLowerCase())
	)

	return (
		<div className={styles.challengeSection}>
			<div className={styles.challengeRow}>
				<button
					type="button"
					className={`${styles.challengeToggle} ${active ? styles.challengeToggleActive : ''}`}
					onClick={handleToggle}
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
						onClick={handleToggleDropdown}
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
						<div className={`${styles.dropdownMenu} ${openUpwards ? styles.dropdownMenuUp : ''}`}>
							{/* 1. Pinned Search Bar (shown when friends list has items) */}
							{friends.length > 0 && (
								<div className={styles.searchWrapper}>
									<svg
										className={styles.searchIcon}
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2.2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<circle cx="11" cy="11" r="8" />
										<line x1="21" y1="21" x2="16.65" y2="16.65" />
									</svg>
									<input
										ref={searchInputRef}
										type="text"
										className={styles.searchInput}
										placeholder={t('search_friends', 'Search friends...')}
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										autoFocus
									/>
									{searchQuery && (
										<button
											type="button"
											className={styles.searchClearBtn}
											onClick={() => {
												setSearchQuery('')
												searchInputRef.current?.focus()
											}}
										>
											✕
										</button>
									)}
								</div>
							)}
							{/* 2. Pinned Deselect Option */}
							{selectedFriend && (
								<div
									className={styles.dropdownClearOption}
									onClick={() => handleSelect('')}
								>
									<span className={styles.clearIcon}>✕</span>
									<span>{t('deselect_friend', '— Deselect friend —')}</span>
								</div>
							)}
							{/* 3. Dedicated Scrollable Friends Container */}
							<div className={styles.friendsList}>
								{friends.length === 0 ? (
									<div className={styles.emptyOptions}>
										{t('no_friends_available', 'No friends found')}
									</div>
								) : filteredFriends.length === 0 ? (
									<div className={styles.emptyOptions}>
										{t('no_friends_match', 'No friends match "{{query}}"', { query: searchQuery })}
									</div>
								) : (
									filteredFriends.map(friend => {
										const isSelected = friend.username === selectedFriend
										return (
											<div
												key={friend.username}
												className={`${styles.dropdownOption} ${isSelected ? styles.optionSelected : ''}`}
												onClick={() => handleSelect(friend.username)}
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
						</div>
					)}
				</div>
			</div>

			{active && friends.length === 0 && (
				<div className={styles.noFriendsMsg}>
					{t('no_friends_to_challenge', 'You don\'t have any friends yet. Add friends to challenge them!')}
				</div>
			)}

			{active && !selectedFriend && friends.length > 0 && (
				<div className={styles.hintMessage}>
					{t('challenge_hint', 'Select a friend, then click a game mode below to send a challenge')}
				</div>
			)}
		</div>
	)
}

export default ChallengeSection
