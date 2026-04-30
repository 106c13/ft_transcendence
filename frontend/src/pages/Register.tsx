import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Auth.css'

function Register() {
	const [email, setEmail] = useState('')
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [repassword, setRepassword] = useState('')
	const [msg, setMsg] = useState('')
	const [error, setError] = useState(false)

	const navigate = useNavigate()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		setMsg('')
		setError(false)

		if (password !== repassword) {
			setMsg('Passwords do not match')
			setError(true)
			return
		}

		const data = {
			email,
			username,
			password,
			repassword,
		}

		try {
			const res = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			})

			const result = await res.json()

			if (!res.ok) {
				setMsg(result.message || 'Something went wrong')
				setError(true)
				return
			}

			setMsg('Account created ✓ Redirecting...')

			setTimeout(() => {
				navigate('/login')
			}, 800)

		} catch (err) {
			setMsg('Network error')
			setError(true)
		}
	}

	return (
		<div className="auth-page">
			<div className="card">
				<h1>Create Account</h1>

				<form onSubmit={handleSubmit}>
					<input
						placeholder="Email"
						name="email"
						value={email}
						onChange={e => setEmail(e.target.value)}
						required
					/>

					<input
						placeholder="Username"
						name="username"
						value={username}
						onChange={e => setUsername(e.target.value)}
						required
					/>

					<input
						type="password"
						placeholder="Password"
						value={password}
						onChange={e => setPassword(e.target.value)}
						required
					/>

					<input
						type="password"
						placeholder="Confirm password"
						value={repassword}
						onChange={e => setRepassword(e.target.value)}
						required
					/>

					<button type="submit">Register</button>
				</form>

				{msg && (
					<div className={`msg ${error ? 'error' : 'success'}`}>
						{msg}
					</div>
				)}

				<a className="link" href="/login">
					Sign in
				</a>
			</div>
		</div>
	)
}

export default Register
