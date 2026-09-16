import { useState, useRef, useEffect } from 'react'
import styles from './CustomSelect.module.css'

export type SelectOption<T extends string = string> = {
	value: T
	label: string
	icon?: string
}

type Props<T extends string = string> = {
	id?: string
	value: T
	options: SelectOption<T>[]
	onChange: (value: T) => void
	minWidth?: string | number
	className?: string
}

export default function CustomSelect<T extends string = string>({
	id,
	value,
	options,
	onChange,
	minWidth,
	className,
}: Props<T>) {
	const [isOpen, setIsOpen] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)

	const selected = options.find((opt) => opt.value === value) || options[0]

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false)
			}
		}

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				setIsOpen(false)
			}
		}

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside)
			document.addEventListener('keydown', handleKeyDown)
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [isOpen])

	return (
		<div className={`${styles.customSelect} ${className || ''}`} ref={containerRef} id={id}>
			<button
				type="button"
				className={`${styles.triggerButton} ${isOpen ? styles.triggerOpen : ''}`}
				onClick={() => setIsOpen((prev) => !prev)}
				style={minWidth ? { minWidth } : undefined}
				aria-haspopup="listbox"
				aria-expanded={isOpen}
			>
				<span className={styles.selectedContent}>
					{selected?.icon && <span className={styles.optionIcon}>{selected.icon}</span>}
					<span className={styles.optionLabel}>{selected?.label}</span>
				</span>
				<span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>▾</span>
			</button>

			{isOpen && (
				<div className={styles.dropdownMenu} role="listbox">
					{options.map((opt) => (
						<div
							key={opt.value}
							className={`${styles.menuItem} ${opt.value === value ? styles.menuItemActive : ''}`}
							onClick={() => {
								onChange(opt.value)
								setIsOpen(false)
							}}
							role="option"
							aria-selected={opt.value === value}
						>
							{opt.icon && <span className={styles.optionIcon}>{opt.icon}</span>}
							<span className={styles.optionLabel}>{opt.label}</span>
						</div>
					))}
				</div>
			)}
		</div>
	)
}

