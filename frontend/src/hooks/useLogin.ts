import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'

export function useLogin() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')

	const navigate = useNavigate()
	const { toast } = useToast()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		const data = { email, password }

		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			})

			const result = await res.json()

			if (!res.ok) {
				toast.error(result.message || 'invalid_credentials')
				return
			}

			localStorage.setItem('token', result.token)
			toast.success(result.message || 'login_successful')

			setTimeout(() => {
				navigate('/home')
			}, 700)
		} catch {
			toast.error('network_error')
		}
	}

	return {
		email,
		password,
		setEmail,
		setPassword,
		handleSubmit,
	}
}
