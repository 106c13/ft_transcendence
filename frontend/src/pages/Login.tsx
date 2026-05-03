import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Auth.css'

function Login() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [msg, setMsg] = useState('')
	const [error, setError] = useState(false)

	const navigate = useNavigate()

	useEffect(() => {
		const token = localStorage.getItem('token')

		if (token) {
			navigate('/profile')
		}
	}, [])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		setMsg('')
		setError(false)

		const data = {
			email,
			password,
		}

		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			})

			const result = await res.json()

			if (!res.ok) {
				setMsg(result.message || 'Invalid credentials')
				setError(true)
				return
			}

			localStorage.setItem('token', result.token)

			setMsg('Login successful ✓ Redirecting...')

			setTimeout(() => {
				navigate('/profile')
			}, 700)

		} catch (err) {
			setMsg('Network error')
			setError(true)
		}
	}

	return (
		<div className="auth-page">
			<div className="card">
				<h1>Login</h1>

				<form onSubmit={handleSubmit}>
					<input
						type="email"
						placeholder="Email"
						name="email"
						value={email}
						onChange={e => setEmail(e.target.value)}
						required
					/>

					<input
						type="password"
						placeholder="Password"
						value={password}
						onChange={e => setPassword(e.target.value)}
						required
					/>

					<button type="submit">Login</button>
				</form>

				{msg && (
					<div className={`msg ${error ? 'error' : 'success'}`}>
						{msg}
					</div>
				)}

				<a className="link" href="/register">
					Create account
				</a>
			</div>
		</div>
	)
}

export default Login
