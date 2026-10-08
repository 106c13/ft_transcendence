import { useState, useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './Tooltip.module.css';

type TooltipProps = {
	content: ReactNode;
	children: ReactNode;
	position?: 'top' | 'bottom';
	disabled?: boolean;
	className?: string;
	inline?: boolean;
	offset?: 'default' | 'navbar';
};

const Tooltip = ({
	content,
	children,
	position = 'top',
	disabled = false,
	className,
	inline = false,
	offset = 'default',
}: TooltipProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const location = useLocation();
	const [prevPath, setPrevPath] = useState(location.pathname);

	// Reset open state during render when route changes
	if (prevPath !== location.pathname) {
		setPrevPath(location.pathname);
		setIsOpen(false);
	}

	// Dismiss on page scroll
	useEffect(() => {
		const handleScroll = () => {
			setIsOpen(false);
		};

		window.addEventListener('scroll', handleScroll, true);
		return () => {
			window.removeEventListener('scroll', handleScroll, true);
		};
	}, []);

	const handleMouseEnter = () => {
		if (!disabled && content) {
			setIsOpen(true);
		}
	};

	const handleMouseLeave = () => {
		setIsOpen(false);
	};

	// Dismiss on click/pointer interactions
	const handleClickCapture = () => {
		setIsOpen(false);
	};

	// Only trigger on keyboard focus (:focus-visible), ignore mouse focus
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

	const effectiveIsOpen = !disabled && Boolean(content) && isOpen;

	return (
		<div
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
					} ${effectiveIsOpen ? styles.visible : ''}`}
					role="tooltip"
					aria-hidden={!effectiveIsOpen}
				>
					{content}
				</span>
			)}
		</div>
	);
};

export default Tooltip;
