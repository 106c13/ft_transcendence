import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function useRegister() {
	const [email, setEmail] = useState('')
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [repassword, setRepassword] = useState('')
	const [msgKey, setMsgKey] = useState('')
	const [error, setError] = useState(false)

	const navigate = useNavigate()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		setMsgKey('')
		setError(false)

		if (password !== repassword) {
			setMsgKey('passwords_do_not_match')
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
				setMsgKey(result.message || 'something_went_wrong')
				setError(true)
				return
			}

			setMsgKey('account_created')
			setError(false)

			setTimeout(() => {
				navigate('/login')
			}, 800)

		} catch (err) {
			setMsgKey('network_error')
			setError(true)
		}
	}

	return {
		email,
		username,
		password,
		repassword,
		msgKey,
		error,
		setEmail,
		setUsername,
		setPassword,
		setRepassword,
		handleSubmit
	}
}
