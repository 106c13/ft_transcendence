import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function useLogin() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [msgKey, setMsgKey] = useState('')
	const [error, setError] = useState(false)

	const navigate = useNavigate()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		setMsgKey('')
		setError(false)

		const data = { email, password }

		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			})

			const result = await res.json()

			if (!res.ok) {
				setMsgKey(result.message || 'invalid_credentials')
				setError(true)
				return
			}

			localStorage.setItem('token', result.token)
			setMsgKey(result.message || 'login_successful')

			setTimeout(() => {
				navigate('/home')
			}, 700)
		} catch {
			setMsgKey('network_error')
			setError(true)
		}
	}

	return {
		email,
		password,
		msgKey,
		error,
		setEmail,
		setPassword,
		handleSubmit,
	}
}
