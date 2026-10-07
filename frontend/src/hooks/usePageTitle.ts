import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function usePageTitle(titleKey: string, options?: Record<string, unknown>) {
	const { t, i18n } = useTranslation();

	useEffect(() => {
		const translated = t(titleKey, options);
		document.title = translated ? `${translated} • ft_transcendence` : 'ft_transcendence';
	}, [t, i18n.language, titleKey, JSON.stringify(options)]);
}

