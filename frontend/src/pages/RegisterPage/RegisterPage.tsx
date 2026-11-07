import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PasswordInput from '../../components/PasswordInput/PasswordInput';
import { useRegister } from '../../hooks/useRegister';
import { usePageTitle } from '../../hooks/usePageTitle';
import styles from '../Common.module.css';

const RegisterPage = () => {
	const { t } = useTranslation();
	usePageTitle('page_title_register');
	const {
		email,
		username,
		password,
		repassword,
		acceptedTerms,
		setEmail,
		setUsername,
		setPassword,
		setRepassword,
		setAcceptedTerms,
		handleSubmit,
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

				<div className={styles.termsGroup}>
					<label className={styles.termsCheckboxLabel}>
						<input
							type="checkbox"
							id="acceptedTerms"
							name="acceptedTerms"
							checked={acceptedTerms}
							onChange={e => setAcceptedTerms(e.target.checked)}
							required
							className={styles.termsCheckbox}
						/>
						<span className={styles.termsText}>
							{t('terms_agreement_prefix')}{' '}
							<Link
								to="/terms"
								target="_blank"
								rel="noopener noreferrer"
								className={styles.termsLink}
							>
								{t('terms_of_service')}
							</Link>{' '}
							{t('terms_agreement_and')}{' '}
							<Link
								to="/privacy"
								target="_blank"
								rel="noopener noreferrer"
								className={styles.termsLink}
							>
								{t('privacy_policy')}
							</Link>
						</span>
					</label>
				</div>

				<button className={styles.button} type="submit">{t('register')}</button>
			</form>

			<Link className={styles.link} to="/login">
				{t('sign_in')}
			</Link>
		</>
	);
};

export default RegisterPage;
