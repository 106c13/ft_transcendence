import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function usePageTitle(titleKey: string, fallback?: string, options?: Record<string, any>) {
	const { t, i18n } = useTranslation();

	useEffect(() => {
		const translated = t(titleKey, options);
		const title = translated && translated !== titleKey ? translated : (fallback || translated);
		document.title = title ? `${title} • ft_transcendence` : 'ft_transcendence';
	}, [t, i18n.language, titleKey, fallback, JSON.stringify(options)]);
}

