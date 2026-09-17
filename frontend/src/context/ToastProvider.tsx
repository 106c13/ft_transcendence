import React, { useState, useCallback, useEffect } from 'react'
import { ToastContext } from './ToastContext'
import type { ToastItem, ToastType, ToastOptions } from './ToastContext'

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [topSlot, setTopSlot] = useState<React.ReactNode>(null)

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (type: ToastType, message: string, options?: ToastOptions): string => {
      const id = options?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      const duration = options?.duration ?? 4000

      const newToast: ToastItem = {
        id,
        type,
        title: options?.title,
        message,
        duration,
        createdAt: Date.now(),
      }

      setToasts((prev) => {
        const filtered = prev.filter((t) => t.id !== id)
        const updated = [...filtered, newToast]
        return updated.slice(-5)
      })

      return id
    },
    []
  )

  // Listen for global custom events from non-hook code
  useEffect(() => {
    const handleGlobalToast = (e: Event) => {
      const customEvent = e as CustomEvent<{
        type: ToastType
        message: string
        options?: ToastOptions
      }>
      if (customEvent.detail) {
        const { type, message, options } = customEvent.detail
        showToast(type, message, options)
      }
    }

    window.addEventListener('app:toast', handleGlobalToast)
    return () => {
      window.removeEventListener('app:toast', handleGlobalToast)
    }
  }, [showToast])

  const toast = {
    success: useCallback(
      (msg: string, opt?: ToastOptions) => showToast('success', msg, opt),
      [showToast]
    ),
    error: useCallback(
      (msg: string, opt?: ToastOptions) => showToast('error', msg, opt),
      [showToast]
    ),
    warning: useCallback(
      (msg: string, opt?: ToastOptions) => showToast('warning', msg, opt),
      [showToast]
    ),
    info: useCallback(
      (msg: string, opt?: ToastOptions) => showToast('info', msg, opt),
      [showToast]
    ),
    dismiss: removeToast,
  }

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        removeToast,
        topSlot,
        setTopSlot,
        toast,
      }}
    >
      {children}
    </ToastContext.Provider>
  )
}

