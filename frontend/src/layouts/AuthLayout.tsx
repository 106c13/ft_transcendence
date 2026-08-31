import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import '../pages/Auth.css'

export default function AuthLayout() {
	const navigate = useNavigate()
	const token = localStorage.getItem('token')

	useEffect(() => {
		if (token) {
			navigate('/home', { replace: true })
		}
	}, [token, navigate])

	return (
		<div className="auth-page">
			<div className="card">
				<Outlet />
			</div>
		</div>
	)
}