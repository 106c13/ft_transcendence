import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { ToastItem as ToastItemType } from '../../context/ToastContext'
import styles from './Toast.module.css'

interface Props {
  toast: ToastItemType
  onDismiss: (id: string) => void
}

export default function ToastItem({ toast, onDismiss }: Props) {
  const { t, i18n } = useTranslation()
  const [remainingTime, setRemainingTime] = useState(toast.duration)
  const [isPaused, setIsPaused] = useState(false)
  const lastTickRef = useRef<number | null>(null)

  // Type icons
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠️',
    info: 'ℹ',
  }

  // Default type titles if no custom title is passed
  const defaultTitles = {
    success: t('toast_success', 'Success'),
    error: t('toast_error', 'Error'),
    warning: t('toast_warning', 'Notice'),
    info: t('toast_info', 'Information'),
  }

  // Message localization check
  const displayMessage = i18n.exists(toast.message)
    ? t(toast.message)
    : toast.message

  const displayTitle = toast.title
    ? i18n.exists(toast.title)
      ? t(toast.title)
      : toast.title
    : defaultTitles[toast.type]

  useEffect(() => {
    if (toast.duration <= 0) return

    lastTickRef.current = Date.now()
    const interval = setInterval(() => {
      if (!isPaused) {
        const now = Date.now()
        const lastTick = lastTickRef.current ?? now
        const elapsed = now - lastTick
        setRemainingTime((prev) => {
          const next = prev - elapsed
          if (next <= 0) {
            clearInterval(interval)
            onDismiss(toast.id)
            return 0
          }
          return next
        })
        lastTickRef.current = now
      }
    }, 50)

    return () => clearInterval(interval)
  }, [toast.id, toast.duration, isPaused, onDismiss])

  const progressPercent =
    toast.duration > 0 ? (remainingTime / toast.duration) * 100 : 0

  return (
    <div
      className={`${styles.toastCard} ${styles[toast.type]}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        lastTickRef.current = Date.now()
        setIsPaused(false)
      }}
      role="alert"
      aria-live="polite"
    >
      <div className={styles.toastMain}>
        <div className={styles.iconWrapper}>
          <span>{icons[toast.type]}</span>
        </div>

        <div className={styles.bodyWrapper}>
          {displayTitle && <h4 className={styles.title}>{displayTitle}</h4>}
          <p className={styles.message}>{displayMessage}</p>
        </div>

        <button
          type="button"
          className={styles.closeBtn}
          onClick={() => onDismiss(toast.id)}
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      </div>

      {toast.duration > 0 && (
        <div className={styles.progressBarTrack}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  )
}

