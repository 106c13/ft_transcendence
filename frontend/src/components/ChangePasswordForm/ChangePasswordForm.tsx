import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../../context/ToastContext'
import styles from './ChangePasswordForm.module.css'

function ChangePasswordForm() {
	const { t } = useTranslation()
	const { toast } = useToast()

	const [oldPassword, setOldPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')

	const [showOld, setShowOld] = useState(false)
	const [showNew, setShowNew] = useState(false)
	const [showConfirm, setShowConfirm] = useState(false)

	const [loading, setLoading] = useState(false)

	const handlePasswordChange = async (e: React.FormEvent) => {
		e.preventDefault()

		if (newPassword !== confirmPassword) {
			toast.error('passwords_do_not_match')
			return
		}

		if (newPassword.length < 8) {
			toast.error('password_too_short')
			return
		}

		const hasLetter = /[a-zA-Z]/.test(newPassword)
		const hasNumber = /[0-9]/.test(newPassword)
		const hasSpecial = /[^a-zA-Z0-9]/.test(newPassword)

		if (!hasLetter || !hasNumber || !hasSpecial) {
			toast.error('password_complexity_error')
			return
		}

		setLoading(true)
		const token = localStorage.getItem('token')

		try {
			const res = await fetch('/api/users/password', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ oldPassword, newPassword }),
			})

			const result = await res.json()

			if (!res.ok) {
				toast.error(result.message || 'password_update_failed')
				return
			}

			toast.success('password_updated')
			setOldPassword('')
			setNewPassword('')
			setConfirmPassword('')
		} catch {
			toast.error('network_error')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className={styles.card}>
			<div className={styles.cardHeader}>
				<h2 className={styles.cardTitle}>
					<span>🔒</span>
					{t('security_title', 'Password & Security')}
				</h2>
				<p className={styles.cardDesc}>
					{t('security_desc', 'Ensure your account is protected with a strong password')}
				</p>
			</div>

			<form className={styles.form} onSubmit={handlePasswordChange}>
				<div className={styles.formGroup}>
					<label className={styles.label} htmlFor="old-password">
						{t('old_password', 'Current Password')}
					</label>
					<div className={styles.passwordWrapper}>
						<input
							id="old-password"
							className={styles.input}
							type={showOld ? 'text' : 'password'}
							placeholder={t('old_password', 'Current Password')}
							value={oldPassword}
							onChange={e => setOldPassword(e.target.value)}
							required
						/>
						<button
							type="button"
							className={styles.eyeBtn}
							onClick={() => setShowOld(!showOld)}
							aria-label={showOld ? t('hide_password', 'Hide password') : t('show_password', 'Show password')}
						>
							<img
								src={showOld ? '/assets/eye-off.svg' : '/assets/eye.svg'}
								alt=""
								width={18}
								height={18}
							/>
						</button>
					</div>
				</div>

				<div className={styles.formGroup}>
					<label className={styles.label} htmlFor="new-password">
						{t('new_password', 'New Password')}
					</label>
					<div className={styles.passwordWrapper}>
						<input
							id="new-password"
							className={styles.input}
							type={showNew ? 'text' : 'password'}
							placeholder={t('new_password', 'New Password')}
							value={newPassword}
							onChange={e => setNewPassword(e.target.value)}
							required
						/>
						<button
							type="button"
							className={styles.eyeBtn}
							onClick={() => setShowNew(!showNew)}
							aria-label={showNew ? t('hide_password', 'Hide password') : t('show_password', 'Show password')}
						>
							<img
								src={showNew ? '/assets/eye-off.svg' : '/assets/eye.svg'}
								alt=""
								width={18}
								height={18}
							/>
						</button>
					</div>
					<p className={styles.fieldHint}>
						{t('password_req_hint', 'Must be at least 8 characters with letters, numbers, and special symbols')}
					</p>
				</div>

				<div className={styles.formGroup}>
					<label className={styles.label} htmlFor="confirm-password">
						{t('confirm_password', 'Confirm Password')}
					</label>
					<div className={styles.passwordWrapper}>
						<input
							id="confirm-password"
							className={styles.input}
							type={showConfirm ? 'text' : 'password'}
							placeholder={t('confirm_password', 'Confirm Password')}
							value={confirmPassword}
							onChange={e => setConfirmPassword(e.target.value)}
							required
						/>
						<button
							type="button"
							className={styles.eyeBtn}
							onClick={() => setShowConfirm(!showConfirm)}
							aria-label={showConfirm ? t('hide_password', 'Hide password') : t('show_password', 'Show password')}
						>
							<img
								src={showConfirm ? '/assets/eye-off.svg' : '/assets/eye.svg'}
								alt=""
								width={18}
								height={18}
							/>
						</button>
					</div>
				</div>

				<div className={styles.actionRow}>
					<button
						className={styles.submitBtn}
						type="submit"
						disabled={loading}
					>
						{loading ? t('updating', 'Updating...') : t('update_password', 'Update password')}
					</button>
				</div>
			</form>
		</div>
	)
}

export default ChangePasswordForm
