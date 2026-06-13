import { useTranslation } from 'react-i18next'
import './NotFound.css'

function NotFound() {
	const { t } = useTranslation()

	return (
		<div className="not-found-container">
			<div className="not-found-content">
				<h1 className="not-found-code">404</h1>
				<h2 className="not-found-title">{t('page_not_found')}</h2>
				<p className="not-found-message">
					{t('page_not_found_message')}
				</p>
				<a href="/home" className="not-found-button">
					{t('go_back_home')}
				</a>
			</div>
		</div>
	)
}

export default NotFound
