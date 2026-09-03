import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import styles from '../pages/Common.module.css'

export default function AuthLayout() {
	const navigate = useNavigate()
	const token = localStorage.getItem('token')

	useEffect(() => {
		if (token) {
			navigate('/home', { replace: true })
		}
	}, [token, navigate])

	return (
		<div className={styles.authPage}>
			<div className={styles.card}>
				<Outlet />
			</div>
		</div>
	)
}