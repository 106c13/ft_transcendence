import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PasswordInput from '../../components/PasswordInput/PasswordInput'
import { useRegister } from '../../hooks/useRegister'
import styles from '../Common.module.css'

function Register() {
	const { t } = useTranslation()
	const {
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
	} = useRegister();

	return (
		<>
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

				<PasswordInput
					value={password}
					onChange={e => setPassword(e.target.value)}
					placeholder={t('password')}
					name="password"
				/>

				<PasswordInput
					value={repassword}
					onChange={e => setRepassword(e.target.value)}
					placeholder={t('confirm_password')}
					name="confirm_password"
				/>

				<button className={styles.button} type="submit">{t('register')}</button>
			</form>

			{msgKey && (
				<div className={`${styles.msg} ${error ? styles.error : styles.success}`}>
					{t(msgKey)}
				</div>
			)}

			<Link className={styles.link} to="/login">
				{t('sign_in')}
			</Link>
		</>
	)
}

export default Register
