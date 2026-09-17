import { useToast } from '../../context/ToastContext'
import ToastItem from './ToastItem'
import styles from './Toast.module.css'

export default function ToastContainer() {
  const { toasts, removeToast, topSlot } = useToast()

  if (!topSlot && toasts.length === 0) {
    return null
  }

  return (
    <div className={styles.notificationStack}>
      {topSlot && <div className={styles.challengeSlot}>{topSlot}</div>}

      {toasts.length > 0 && (
        <div className={styles.toastList}>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
          ))}
        </div>
      )}
    </div>
  )
}

