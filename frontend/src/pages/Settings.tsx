import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Profile.css'

function Settings() {
	const [username, setUsername] = useState('')
	const [email, setEmail] = useState('')
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

					<button type="submit">Save</button>
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
				</form>
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
