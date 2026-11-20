import { useState, useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './Tooltip.module.css';

type TooltipProps = {
	content: ReactNode;
	children: ReactNode;
	position?: 'top' | 'bottom';
	align?: 'center' | 'left' | 'right';
	disabled?: boolean;
	className?: string;
	inline?: boolean;
	offset?: 'default' | 'navbar';
};

const Tooltip = ({
	content,
	children,
	position = 'top',
	align = 'center',
	disabled = false,
	className,
	inline = false,
	offset = 'default',
}: TooltipProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const location = useLocation();
	const [prevPath, setPrevPath] = useState(location.pathname);

	if (prevPath !== location.pathname) {
		setPrevPath(location.pathname);
		setIsOpen(false);
	}

	const effectiveIsOpen = !disabled && Boolean(content) && isOpen;

	useEffect(() => {
		if (!effectiveIsOpen) return;

		const handleScroll = () => {
			setIsOpen(false);
		};

		window.addEventListener('scroll', handleScroll, true);
		return () => {
			window.removeEventListener('scroll', handleScroll, true);
		};
	}, [effectiveIsOpen]);

	const handleMouseEnter = () => {
		if (!disabled && content) {
			setIsOpen(true);
		}
	};

	const handleMouseLeave = () => {
		setIsOpen(false);
	};

	const handleClickCapture = () => {
		setIsOpen(false);
	};

	// Trigger only on keyboard focus (:focus-visible)
	const handleFocus = (e: React.FocusEvent) => {
		if (disabled || !content) return;
		try {
			if (e.target instanceof HTMLElement && !e.target.matches(':focus-visible')) {
				return;
			}
		} catch {
			// Fallback if matches is unsupported
		}
		setIsOpen(true);
	};

	const handleBlur = (e: React.FocusEvent) => {
		if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
			setIsOpen(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Escape') {
			setIsOpen(false);
		}
	};

	const alignClass =
		align === 'left' ? styles.alignLeft : align === 'right' ? styles.alignRight : '';

	return (
		<span
			className={`${styles.tooltipContainer} ${inline ? styles.inline : ''} ${className || ''}`}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			onClickCapture={handleClickCapture}
			onFocus={handleFocus}
			onBlur={handleBlur}
			onKeyDown={handleKeyDown}
		>
			{children}
			{!disabled && Boolean(content) && (
				<span
					className={`${styles.tooltipBubble} ${position === 'bottom' ? styles.bottom : styles.top} ${
						offset === 'navbar' ? styles.navbarOffset : ''
					} ${alignClass} ${effectiveIsOpen ? styles.visible : ''}`}
					role="tooltip"
					aria-hidden={!effectiveIsOpen}
				>
					{content}
				</span>
			)}
		</span>
	);
};

export default Tooltip;
