import { useState, useMemo, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { User } from '../../constants/profileConstants'
import { useToast } from '../../context/ToastContext'
import styles from './ProfileInfoForm.module.css'

type Props = {
	initialUser?: User | null
	onUserUpdated?: (user: User) => void
}

function ProfileInfoForm({ initialUser, onUserUpdated }: Props) {
	const { t } = useTranslation()
	const fileInputRef = useRef<HTMLInputElement>(null)

	const [username, setUsername] = useState(() => initialUser?.username || '')
	const [email, setEmail] = useState(() => initialUser?.email || '')
	const [bio, setBio] = useState(() => initialUser?.bio || '')
	const [prevUser, setPrevUser] = useState(initialUser)

	// Adjust local state if initialUser updates from parent
	if (initialUser !== prevUser) {
		setPrevUser(initialUser)
		setUsername(initialUser?.username || '')
		setEmail(initialUser?.email || '')
		setBio(initialUser?.bio || '')
	}

	const { toast } = useToast()

	const [avatarFile, setAvatarFile] = useState<File | null>(null)
	const [loading, setLoading] = useState(false)

	// Compute preview URL whenever avatarFile changes
	const previewUrl = useMemo(() => {
		if (!avatarFile) return null
		return URL.createObjectURL(avatarFile)
	}, [avatarFile])

	// Revoke object URL on cleanup
	useEffect(() => {
		return () => {
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl)
			}
		}
	}, [previewUrl])

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files?.[0]) {
			setAvatarFile(e.target.files[0])
		}
	}

	const handleCancelAvatar = () => {
		setAvatarFile(null)
		if (fileInputRef.current) {
			fileInputRef.current.value = ''
		}
	}

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault()

		// Client validation
		if (/[^a-zA-Z0-9]/.test(username)) {
			toast.error('username_invalid_chars')
			return
		}

		if (username.length > 15) {
			toast.error('username_too_long')
			return
		}

		if (bio.length > 100) {
			toast.error('bio_too_long')
			return
		}

		setLoading(true)
		const token = localStorage.getItem('token')
		const formData = new FormData()

		formData.append('username', username)
		formData.append('email', email)
		formData.append('bio', bio)

		if (avatarFile) {
			formData.append('file', avatarFile)
		}

		try {
			const res = await fetch('/api/users/me', {
				method: 'PATCH',
				headers: { Authorization: `Bearer ${token}` },
				body: formData,
			})

			const result = await res.json()

			if (res.status === 413) {
				toast.error('image_too_big')
				return
			}

			if (!res.ok) {
				toast.error(result.message || 'update_failed')
				return
			}

			toast.success('saved')
			setAvatarFile(null)
			if (fileInputRef.current) {
				fileInputRef.current.value = ''
			}

			// Refresh currentUser context so Navbar & other components update immediately
			if (onUserUpdated && token) {
				const refreshRes = await fetch('/api/users/me', {
					headers: { Authorization: `Bearer ${token}` },
				})
				if (refreshRes.ok) {
					const refreshedUser = await refreshRes.json()
					onUserUpdated(refreshedUser)
				}
			}
		} catch {
			toast.error('network_error')
		} finally {
			setLoading(false)
		}
	}

	// Current avatar display image
	const displayAvatar =
		previewUrl ||
		(initialUser?.avatar ? `/uploads/${initialUser.avatar}` : '/assets/default.jpg')

	return (
		<div className={styles.card}>
			<div className={styles.cardHeader}>
				<h2 className={styles.cardTitle}>
					<span>👤</span>
					{t('profile_info_title', 'Profile Information')}
				</h2>
				<p className={styles.cardDesc}>
					{t('profile_info_desc', 'Update your avatar, username, and bio details')}
				</p>
			</div>

			{/* Avatar upload section */}
			<div className={styles.avatarSection}>
				<div className={styles.avatarWrapper}>
					<img
						src={displayAvatar}
						alt={t('avatar_preview', 'Avatar preview')}
						className={styles.avatarImage}
					/>
				</div>

				<div className={styles.avatarActions}>
					<div className={styles.avatarButtons}>
						<button
							type="button"
							className={styles.uploadBtn}
							onClick={() => fileInputRef.current?.click()}
						>
							📷 {t('change_avatar', 'Change Avatar')}
						</button>

						{avatarFile && (
							<button
								type="button"
								className={styles.cancelBtn}
								onClick={handleCancelAvatar}
							>
								✕ {t('cancel_photo', 'Cancel')}
							</button>
						)}
					</div>

					<p className={styles.avatarHint}>
						{t('avatar_hint', 'Supports JPG, PNG or WebP. Max 5MB.')}
					</p>

					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						onChange={handleFileChange}
						className={styles.hiddenFileInput}
					/>
				</div>
			</div>

			<form className={styles.form} onSubmit={handleSave}>
				<div className={styles.formGroup}>
					<label className={styles.label} htmlFor="settings-username">
						{t('username', 'Username')}
					</label>
					<input
						id="settings-username"
						className={styles.input}
						value={username}
						onChange={e => setUsername(e.target.value)}
						placeholder={t('username', 'Username')}
						maxLength={15}
						required
					/>
					<p className={styles.fieldHint}>
						{t('username_hint', 'Letters and numbers only, max 15 characters')}
					</p>
				</div>

				<div className={styles.formGroup}>
					<label className={styles.label} htmlFor="settings-email">
						{t('email', 'Email')}
					</label>
					<input
						id="settings-email"
						type="email"
						className={styles.input}
						value={email}
						onChange={e => setEmail(e.target.value)}
						placeholder={t('email', 'Email')}
						required
					/>
				</div>

				<div className={styles.formGroup}>
					<div className={styles.labelRow}>
						<label className={styles.label} htmlFor="settings-bio">
							{t('bio', 'Bio')}
						</label>
						<span
							className={`${styles.charCount} ${
								bio.length > 85 ? styles.charCountWarn : ''
							}`}
						>
							{bio.length}/100
						</span>
					</div>
					<textarea
						id="settings-bio"
						className={styles.textarea}
						value={bio}
						onChange={e => setBio(e.target.value)}
						placeholder={t('bio', 'Bio')}
						maxLength={100}
						rows={3}
					/>
				</div>

				<div className={styles.actionRow}>
					<button
						className={styles.submitBtn}
						type="submit"
						disabled={loading}
					>
						{loading ? t('saving', 'Saving...') : t('save', 'Save')}
					</button>
				</div>
			</form>
		</div>
	)
}

export default ProfileInfoForm
