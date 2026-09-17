import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";

export function useRegister() {
	const [email, setEmail] = useState('')
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [repassword, setRepassword] = useState('')

	const navigate = useNavigate()
	const { toast } = useToast()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (password !== repassword) {
			toast.error('passwords_do_not_match')
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
				toast.error(result.message || 'something_went_wrong')
				return
			}

			localStorage.setItem('token', result.token)
			toast.success(result.message || 'account_created')

			setTimeout(() => {
				navigate('/home')
			}, 800)

		} catch {
			toast.error('network_error')
		}
	}

	return {
		email,
		username,
		password,
		repassword,
		setEmail,
		setUsername,
		setPassword,
		setRepassword,
		handleSubmit
	}
}
