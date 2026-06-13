import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './Profile.css'

function Settings() {
	const { t } = useTranslation()
	const [username, setUsername] = useState('')
	const [email, setEmail] = useState('')
	const [oldPassword, setOldPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [avatar, setAvatar] = useState<File | null>(null)
	const [bio, setBio] = useState('')
	const [msg, setMsg] = useState('')
	const [error, setError] = useState(false)
	const navigate = useNavigate()

	useEffect(() => {
		const token = localStorage.getItem('token')

		if (!token) {
			navigate('/login')
			return
		}

		fetch('/api/users/me', {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})
			.then(res => res.json())
			.then(data => {
				setUsername(data.username)
				setEmail(data.email)
				setBio(data.bio || '')
			})
	}, [])

	const handlePasswordChange = async (e: React.FormEvent) => {
		e.preventDefault()

		setMsg('')
		setError(false)

		if (newPassword !== confirmPassword) {
			setMsg(t('passwords_do_not_match'))
			setError(true)
			return
		}

		const token = localStorage.getItem('token')

		const res = await fetch('/api/users/password', {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				oldPassword,
				newPassword,
			}),
		})

		const result = await res.json()

		if (!res.ok) {
			setMsg(result.message || t('password_update_failed'))
			setError(true)
			return
		}

		setMsg(t('password_updated'))
		setError(false)

		setOldPassword('')
		setNewPassword('')
		setConfirmPassword('')
	}

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault()

		const token = localStorage.getItem('token')

		const formData = new FormData()

		formData.append('username', username)
		formData.append('email', email)
		formData.append('bio', bio)

		if (avatar) {
			formData.append('file', avatar)
		}

		const res = await fetch('/api/users/me', {
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${token}`,
			},
			body: formData,
		})

		const result = await res.json()

		if (res.status == 413) {
			setMsg(result.message || t('image_too_big'))
			setError(true)
		}

		if (!res.ok) {
			setMsg(result.message || t('update_failed'))
			setError(true)
			return
		}

		setError(false)
		setMsg(t('saved'))
	}

	return (
		<div className="auth-page">
			<div className="card">
				<h1>{t('settings')}</h1>

				<form onSubmit={handleSave}>
					<input
						value={username}
						onChange={e => setUsername(e.target.value)}
						placeholder={t('username')}
					/>

					<input
						value={email}
						onChange={e => setEmail(e.target.value)}
						placeholder={t('email')}
					/>

					<textarea
						value={bio}
						onChange={e => setBio(e.target.value)}
						placeholder={t('bio')}
					/>

					<input
						type="file"
						accept="image/*"
						onChange={e => {
							if (e.target.files?.[0]) {
								setAvatar(e.target.files[0])
							}
						}}
					/>

					<button className="button" type="submit">{t('save')}</button>
				</form>

				<h1 style={{ marginTop: '30px' }}>{t('change_password')}</h1>
				<form onSubmit={handlePasswordChange}>
					<input
						type="password"
						placeholder={t('old_password')}
						value={oldPassword}
						onChange={e => setOldPassword(e.target.value)}
						required
					/>

					<input
						type="password"
						placeholder={t('new_password')}
						value={newPassword}
						onChange={e => setNewPassword(e.target.value)}
						required
					/>

					<input
						type="password"
						placeholder={t('confirm_password')}
						value={confirmPassword}
						onChange={e => setConfirmPassword(e.target.value)}
						required
					/>

					<button className="button" type="submit">{t('update_password')}</button>
				</form>

				<button
					onClick={() => navigate('/profile')}
					style={{
						marginTop: '10px',
						background: '#334155',
						color: 'white',
						padding: '10px',
						borderRadius: '8px',
						border: 'none',
						cursor: 'pointer',
						width: '100%',
					}}
				>
					← {t('back_to_profile')}
				</button>

				{msg && (
					<div className={`msg ${error ? 'error' : 'success'}`}>
						{msg}
					</div>
				)}

			</div>
		</div>
	)
}

export default Settings
