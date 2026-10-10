import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'
import styles from './PasswordInput.module.css'

type Props = {
	value: string
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
	placeholder: string
	name?: string
	required?: boolean
}

function PasswordInput({ value, onChange, placeholder, name = 'password', required = true }: Props) {
	const { t } = useTranslation()
	const [showPassword, setShowPassword] = useState(false)

	return (
		<div className={styles.passwordWrapper}>
			<input
				type={showPassword ? 'text' : 'password'}
				placeholder={placeholder}
				name={name}
				value={value}
				onChange={onChange}
				required={required}
			/>

			<button
				type="button"
				className={styles.eyeBtn}
				onClick={() => setShowPassword(prev => !prev)}
				aria-label={showPassword ? t('hide_password') : t('show_password')}
			>
				{showPassword ? (
					<EyeOff size={18} aria-hidden="true" />
				) : (
					<Eye size={18} aria-hidden="true" />
				)}
			</button>
		</div>
	)
}

export default PasswordInput
