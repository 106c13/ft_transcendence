import { useState, useRef, useEffect } from 'react';
import styles from './CustomSelect.module.css';

import type { SelectOption } from '../../utils/selectUtils';
export type { SelectOption };

type Props<T extends string = string> = {
	id?: string;
	value: T;
	options: SelectOption<T>[];
	onChange: (value: T) => void;
	minWidth?: string | number;
	className?: string;
};

const CustomSelect = <T extends string = string>({
	id,
	value,
	options,
	onChange,
	minWidth,
	className,
}: Props<T>) => {
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const selected = options.find((opt) => opt.value === value) || options[0];
	const hasAnyIcon = options.some((opt) => Boolean(opt.icon));

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
			document.addEventListener('keydown', handleKeyDown);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [isOpen]);

	return (
		<div className={`${styles.customSelect} ${isOpen ? styles.selectOpen : ''} ${className || ''}`} ref={containerRef} id={id}>
			<button
				type="button"
				className={`${styles.triggerButton} ${isOpen ? styles.triggerOpen : ''} ${hasAnyIcon ? styles.triggerWithIcon : ''}`}
				onClick={() => setIsOpen((prev) => !prev)}
				style={minWidth ? { minWidth } : undefined}
				aria-haspopup="listbox"
				aria-expanded={isOpen}
			>
				<span className={`${styles.selectedContent} ${hasAnyIcon ? styles.selectedContentWithIcon : ''}`}>
					{hasAnyIcon && (
						<span className={styles.iconSlot} aria-hidden="true">
							{selected?.icon || null}
						</span>
					)}
					<span className={styles.optionLabel}>{selected?.label}</span>
				</span>
				<span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>▾</span>
			</button>

			{isOpen && (
				<div className={styles.dropdownMenu} role="listbox">
					{options.map((opt) => (
						<div
							key={opt.value}
							className={`${styles.menuItem} ${hasAnyIcon ? styles.menuItemWithIcon : ''} ${opt.value === value ? styles.menuItemActive : ''}`}
							onClick={() => {
								onChange(opt.value);
								setIsOpen(false);
							}}
							role="option"
							aria-selected={opt.value === value}
						>
							{hasAnyIcon && (
								<span className={styles.iconSlot} aria-hidden="true">
									{opt.icon || null}
								</span>
							)}
							<span className={styles.optionLabel}>{opt.label}</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default CustomSelect;

