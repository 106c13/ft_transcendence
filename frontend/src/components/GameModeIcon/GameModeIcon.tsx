import { Flame, Zap, Timer, Swords } from 'lucide-react';

interface GameModeIconProps {
	mode: string;
	size?: number;
	className?: string;
}

const GameModeIcon = ({ mode, size = 16, className = '' }: GameModeIconProps) => {
	const lower = (mode || '').toLowerCase();

	if (lower.includes('bullet')) {
		return <Flame size={size} color="#f59e0b" className={className} aria-hidden="true" />;
	}

	if (lower.includes('blitz')) {
		return <Zap size={size} color="#38bdf8" className={className} aria-hidden="true" />;
	}

	if (lower.includes('rapid')) {
		return <Timer size={size} color="#818cf8" className={className} aria-hidden="true" />;
	}

	return <Swords size={size} color="currentColor" className={className} aria-hidden="true" />;
};

export default GameModeIcon;
