import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Profile.css'

function Settings() {
	const [username, setUsername] = useState('')
	const [email, setEmail] = useState('')
	const [bio, setBio] = useState('')
	const [msg, setMsg] = useState('')
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

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault()

		const token = localStorage.getItem('token')

		const res = await fetch('/api/users/me', {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				username,
				email,
				bio,
			}),
		})

		if (!res.ok) {
			setMsg('Update failed')
			return
		}

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

					<button type="submit">Save</button>
				</form>

				{msg && <div className="msg">{msg}</div>}
			</div>
		</div>
	)
}

export default Settings
