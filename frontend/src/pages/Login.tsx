import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './Auth.css'

function Login() {
	const { t } = useTranslation()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [msg, setMsg] = useState('')
	const [error, setError] = useState(false)
	const [showPassword, setShowPassword] = useState(false)

	const navigate = useNavigate()

	useEffect(() => {
		const token = localStorage.getItem('token')

		if (token) {
			navigate('/home')
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
				setMsg(result.message || t('invalid_credentials'))
				setError(true)
				return
			}

			localStorage.setItem('token', result.token)

			setMsg(t('login_successful'))

			setTimeout(() => {
				navigate('/home')
			}, 700)

		} catch (err) {
			setMsg(t('network_error'))
			setError(true)
		}
	}

	return (
		<div className="auth-page">
			<div className="card">
				<h1>{t('login')}</h1>

				<form onSubmit={handleSubmit}>
					<input
						type="email"
						placeholder={t('email')}
						name="email"
						value={email}
						onChange={e => setEmail(e.target.value)}
						required
					/>

					<div className="password-wrapper">
						<input
							type={showPassword ? 'text' : 'password'}
							placeholder={t('password')}
							value={password}
							onChange={e => setPassword(e.target.value)}
							required
						/>

						<button
							type="button"
							className="eye-btn"
							onClick={() => setShowPassword(prev => !prev)}
						>
							{showPassword ? (
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
									<path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-6.94" />
									<path d="M1 1l22 22" />
									<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
								</svg>
							) : (
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
									<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
									<circle cx="12" cy="12" r="3" />
								</svg>
							)}
						</button>
					</div>

					<button className="button" type="submit">{t('login')}</button>
				</form>

				{msg && (
					<div className={`msg ${error ? 'error' : 'success'}`}>
						{msg}
					</div>
				)}

				<a className="link" href="/register">
					{t('create_account')}
				</a>
			</div>
		</div>
	)
}

export default Login
