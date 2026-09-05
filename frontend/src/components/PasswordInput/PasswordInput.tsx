import { useState } from 'react'
import styles from './PasswordInput.module.css'

type Props = {
	value: string
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
	placeholder: string
	name?: string
	required?: boolean
}

function PasswordInput({ value, onChange, placeholder, name = 'password', required = true }: Props) {
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
			>
				<img
					src={showPassword ? '/assets/eye-off.svg' : '/assets/eye.svg'}
					alt={showPassword ? 'Hide password' : 'Show password'}
					width={18}
					height={18}
				/>
			</button>
		</div>
	)
}

export default PasswordInput
