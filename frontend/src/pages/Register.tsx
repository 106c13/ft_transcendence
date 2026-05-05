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
	const [showPassword, setShowPassword] = useState(false)

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

					<div className="password-wrapper">
						<input
							type={showPassword ? 'text' : 'password'}
							placeholder="Password"
							value={password}
							onChange={e => setPassword(e.target.value)}
							required
						/>

						<input
							type={showPassword ? 'text' : 'password'}
							placeholder="Confirm assword"
							value={repassword}
							onChange={e => setRepassword(e.target.value)}
							required
						/>

						<button
							type="button"
							className="eye-btn-r"
							onClick={() => setShowPassword(prev => !prev)}
						>

						{showPassword ? (
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
								<path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-6.94" />
								<path d="M1 1l22 22" />
							</svg>
						) : (
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
								<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
								<circle cx="12" cy="12" r="3" />
							</svg>
						)}

						</button>
					</div>

					<button className="button" type="submit">Register</button>
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
