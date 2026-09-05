import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import PasswordInput from '../PasswordInput/PasswordInput'
import styles from '../../pages/Common.module.css'

function ChangePasswordForm() {
	const { t } = useTranslation()
	const [oldPassword, setOldPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [msg, setMsg] = useState('')
	const [error, setError] = useState(false)

	const handlePasswordChange = async (e: React.FormEvent) => {
		e.preventDefault()
		setMsg('')
		setError(false)

		if (newPassword !== confirmPassword) {
			setMsg('passwords_do_not_match')
			setError(true)
			return
		}

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
				setMsg(result.message || 'password_update_failed')
				setError(true)
				return
			}

			setMsg('password_updated')
			setError(false)
			setOldPassword('')
			setNewPassword('')
			setConfirmPassword('')
		} catch {
			setMsg('network_error')
			setError(true)
		}
	}

	return (
		<>
			<h1 style={{ marginTop: '30px' }}>{t('change_password')}</h1>
			<form onSubmit={handlePasswordChange}>
				<PasswordInput
					placeholder={t('old_password')}
					value={oldPassword}
					onChange={e => setOldPassword(e.target.value)}
				/>
				<PasswordInput
					placeholder={t('new_password')}
					value={newPassword}
					onChange={e => setNewPassword(e.target.value)}
				/>
				<PasswordInput
					placeholder={t('confirm_password')}
					value={confirmPassword}
					onChange={e => setConfirmPassword(e.target.value)}
				/>

				<button className={styles.button} type="submit">
					{t('update_password')}
				</button>
			</form>

			{msg && (
				<div className={`${styles.msg} ${error ? styles.error : styles.success}`}>
					{t(msg)}
				</div>
			)}
		</>
	)
}

export default ChangePasswordForm
