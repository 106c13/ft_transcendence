import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import type { ToastItem as ToastItemType } from '../../context/ToastContext';
import styles from './Toast.module.css';

interface Props {
  toast: ToastItemType;
  onDismiss: (id: string) => void;
}

const renderToastIcon = (type: ToastItemType['type']) => {
  switch (type) {
    case 'success':
      return <Check size={18} aria-hidden="true" />;
    case 'error':
      return <AlertCircle size={18} aria-hidden="true" />;
    case 'warning':
      return <AlertTriangle size={18} aria-hidden="true" />;
    case 'info':
    default:
      return <Info size={18} aria-hidden="true" />;
  }
};

const ToastItem = ({ toast, onDismiss }: Props) => {
  const { t, i18n } = useTranslation();
  const [remainingTime, setRemainingTime] = useState(toast.duration);
  const [isPaused, setIsPaused] = useState(false);
  const lastTickRef = useRef<number | null>(null);

  // Default type titles if no custom title is passed
  const defaultTitles = {
    success: t('toast_success'),
    error: t('toast_error'),
    warning: t('toast_warning'),
    info: t('toast_info'),
  };

  // Message localization check
  const displayMessage = i18n.exists(toast.message)
    ? t(toast.message)
    : toast.message;

  const displayTitle = toast.title
    ? i18n.exists(toast.title)
      ? t(toast.title)
      : toast.title
    : defaultTitles[toast.type];

  useEffect(() => {
    if (toast.duration <= 0) return;

    lastTickRef.current = Date.now();
    const interval = setInterval(() => {
      if (!isPaused) {
        const now = Date.now();
        const lastTick = lastTickRef.current ?? now;
        const elapsed = now - lastTick;
        setRemainingTime((prev) => {
          const next = prev - elapsed;
          if (next <= 0) {
            clearInterval(interval);
            onDismiss(toast.id);
            return 0;
          }
          return next;
        });
        lastTickRef.current = now;
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast.id, toast.duration, isPaused, onDismiss]);

  const progressPercent =
    toast.duration > 0 ? (remainingTime / toast.duration) * 100 : 0;

  return (
    <div
      className={`${styles.toastCard} ${styles[toast.type]}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        lastTickRef.current = Date.now();
        setIsPaused(false);
      }}
      role="alert"
      aria-live="polite"
    >
      <div className={styles.toastMain}>
        <div className={styles.iconWrapper}>
          {renderToastIcon(toast.type)}
        </div>

        <div className={styles.bodyWrapper}>
          {displayTitle && <h4 className={styles.title}>{displayTitle}</h4>}
          <p className={styles.message}>{displayMessage}</p>
        </div>

        <button
          type="button"
          className={styles.closeBtn}
          onClick={() => onDismiss(toast.id)}
          aria-label={t('dismiss_notification')}
        >
          <X size={14} aria-hidden="true" />
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
  );
};

export default ToastItem;


