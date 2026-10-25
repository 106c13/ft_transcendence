import { useEffect, useState, type ComponentProps } from 'react';
import Tooltip from '../Tooltip/Tooltip';

export const MOBILE_QUERY = '(max-width: 1024px)';

export const useIsMobile = () => {
	const [isMobile, setIsMobile] = useState(
		() => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
	);

	useEffect(() => {
		const mql = window.matchMedia(MOBILE_QUERY);
		const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
		setIsMobile(mql.matches);
		mql.addEventListener('change', onChange);
		return () => mql.removeEventListener('change', onChange);
	}, []);

	return isMobile;
};

const NavTooltip = (props: ComponentProps<typeof Tooltip>) => {
	const isMobile = useIsMobile();
	if (isMobile) return <>{props.children}</>;
	return <Tooltip {...props} />;
};

export default NavTooltip;