import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './Auth.css'

function Register() {
	const [email, setEmail] = useState('')
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [repassword, setRepassword] = useState('')
	const [msg, setMsg] = useState('')
	const [error, setError] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	const { t } = useTranslation()

	const navigate = useNavigate()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		setMsg('')
		setError(false)

		if (password !== repassword) {
			setMsg(t('passwords_do_not_match'))
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
				setMsg(result.message || t('something_went_wrong'))
				setError(true)
				return
			}

			setMsg(t('account_created'))
			setError(false)

			setTimeout(() => {
				navigate('/login')
			}, 800)

		} catch (err) {
			setMsg(t('network_error'))
			setError(true)
		}
	}

	return (
		<div className="auth-page">
			<div className="card">
				<h1>{t('create_account')}</h1>

				<form onSubmit={handleSubmit}>
					<input
						placeholder={t('email')}
						name="email"
						type="email"
						value={email}
						onChange={e => setEmail(e.target.value)}
						required
					/>

					<input
						placeholder={t('username')}
						name="username"
						value={username}
						onChange={e => setUsername(e.target.value)}
						required
					/>

					<input
						type={showPassword ? 'text' : 'password'}
						placeholder={t('password')}
						value={password}
						onChange={e => setPassword(e.target.value)}
						required
					/>

					<div className="password-wrapper">
						<input
							type={showPassword ? 'text' : 'password'}
							placeholder={t('confirm_password')}
							value={repassword}
							onChange={e => setRepassword(e.target.value)}
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
									<path d="M1 1l22 22" strokeWidth="2" />
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

					<button className="button" type="submit">{t('register')}</button>
				</form>

				{msg && (
					<div className={`msg ${error ? 'error' : 'success'}`}>
						{msg}
					</div>
				)}

				<a className="link" href="/login">
					{t('sign_in')}
				</a>
			</div>
		</div>
	)
}

export default Register
