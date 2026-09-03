import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import styles from '../../pages/Common.module.css'

type Props = {
	initialUser?: {
		username: string
		email: string
		bio?: string
	} | null
}

function ProfileInfoForm({ initialUser }: Props) {
	const { t } = useTranslation()
	const [username, setUsername] = useState('')
	const [email, setEmail] = useState('')
	const [bio, setBio] = useState('')
	const [avatar, setAvatar] = useState<File | null>(null)
	const [msg, setMsg] = useState('')
	const [error, setError] = useState(false)

	useEffect(() => {
		if (initialUser) {
			setUsername(initialUser.username || '')
			setEmail(initialUser.email || '')
			setBio(initialUser.bio || '')
		}
	}, [initialUser])

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault()
		setMsg('')
		setError(false)

		const token = localStorage.getItem('token')
		const formData = new FormData()

		formData.append('username', username)
		formData.append('email', email)
		formData.append('bio', bio)

		if (avatar) {
			formData.append('file', avatar)
		}

		try {
			const res = await fetch('/api/users/me', {
				method: 'PATCH',
				headers: { Authorization: `Bearer ${token}` },
				body: formData,
			})

			const result = await res.json()

			if (res.status === 413) {
				setMsg('image_too_big')
				setError(true)
				return
			}

			if (!res.ok) {
				setMsg(result.message || 'update_failed')
				setError(true)
				return
			}

			setError(false)
			setMsg('saved')
		} catch {
			setMsg('network_error')
			setError(true)
		}
	}

	return (
		<>
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

				<button className={styles.button} type="submit">
					{t('save')}
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

export default ProfileInfoForm
