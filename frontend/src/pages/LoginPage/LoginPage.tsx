import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLogin } from '../../hooks/useLogin'
import PasswordInput from '../../components/PasswordInput/PasswordInput'
import styles from '../Common.module.css'

function Login() {
	const { t } = useTranslation()
	const {
		email,
		password,
		msgKey,
		error,
		setEmail,
		setPassword,
		handleSubmit,
	} = useLogin()

	return (
		<>
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

				<PasswordInput
					value={password}
					onChange={e => setPassword(e.target.value)}
					placeholder={t('password')}
				/>

				<button className={styles.button} type="submit">
					{t('login')}
				</button>
			</form>

			{msgKey && (
				<div className={`${styles.msg} ${error ? styles.error : styles.success}`}>
					{t(msgKey)}
				</div>
			)}

			<Link className={styles.link} to="/register">
				{t('create_account')}
			</Link>
		</>
	)
}

export default Login
