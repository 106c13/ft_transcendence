import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Profile.css'

function Settings() {
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
			setMsg('Passwords do not match')
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
			setMsg(result.message || 'Password update failed')
			setError(true)
			return
		}

		setMsg('Password updated ✓')
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

		if (!res.ok) {
			setMsg(result.message || 'Update failed')
			setError(true)
			return
		}

		setError(false)
		setMsg('Saved ✓')
	}

	return (
		<div className="auth-page">
			<div className="card">
				<h1>Settings</h1>

				<form onSubmit={handleSave}>
					<input
						value={username}
						onChange={e => setUsername(e.target.value)}
						placeholder="Username"
					/>

					<input
						value={email}
						onChange={e => setEmail(e.target.value)}
						placeholder="Email"
					/>

					<textarea
						value={bio}
						onChange={e => setBio(e.target.value)}
						placeholder="Bio"
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


					<button type="submit">Save</button>
				</form>

				<h1 style={{ marginTop: '30px' }}>Change password</h1>
				<form onSubmit={handlePasswordChange}>
					<input
						type="password"
						placeholder="Old password"
						value={oldPassword}
						onChange={e => setOldPassword(e.target.value)}
						required
					/>

					<input
						type="password"
						placeholder="New password"
						value={newPassword}
						onChange={e => setNewPassword(e.target.value)}
						required
					/>

					<input
						type="password"
						placeholder="Confirm password"
						value={confirmPassword}
						onChange={e => setConfirmPassword(e.target.value)}
						required
					/>

					<button type="submit">Update password</button>
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
					← Back to Profile
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
