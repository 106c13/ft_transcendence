import React, { createContext, useContext } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastOptions {
  title?: string
  duration?: number
  id?: string
}

export interface ToastItem {
  id: string
  type: ToastType
  title?: string
  message: string
  duration: number
  createdAt: number
}

export interface ToastContextValue {
  toasts: ToastItem[]
  showToast: (type: ToastType, message: string, options?: ToastOptions) => string
  removeToast: (id: string) => void
  topSlot: React.ReactNode
  setTopSlot: (node: React.ReactNode) => void
  toast: {
    success: (message: string, options?: ToastOptions) => string
    error: (message: string, options?: ToastOptions) => string
    warning: (message: string, options?: ToastOptions) => string
    info: (message: string, options?: ToastOptions) => string
    dismiss: (id: string) => void
  }
}

export const ToastContext = createContext<ToastContextValue | null>(null)

// Dispatch toast events from outside React components
export function showGlobalToast(type: ToastType, message: string, options?: ToastOptions) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('app:toast', {
        detail: { type, message, options },
      })
    )
  }
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

