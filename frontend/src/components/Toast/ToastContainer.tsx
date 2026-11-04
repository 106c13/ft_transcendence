import { useToast } from '../../context/ToastContext';
import ToastItem from './ToastItem';
import styles from './Toast.module.css';

const ToastContainer = () => {
  const { toasts, removeToast, topSlot } = useToast();

  if (!topSlot && toasts.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.notificationStack} fixed top-20 right-4 z-toast flex flex-col gap-3 pointer-events-none max-w-sm w-full box-border`}>
      {topSlot && <div className={`${styles.challengeSlot} pointer-events-auto`}>{topSlot}</div>}

      {toasts.length > 0 && (
        <div className={`${styles.toastList} pointer-events-auto flex flex-col gap-2.5`}>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ToastContainer;

