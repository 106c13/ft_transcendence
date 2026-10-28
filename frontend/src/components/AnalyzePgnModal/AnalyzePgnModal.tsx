import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollText, X } from 'lucide-react'
import styles from './AnalyzePgnModal.module.css'

interface AnalyzePgnModalProps {
    isOpen: boolean
    onClose: () => void
    onLoadPgn: (pgn: string) => void
}

export default function AnalyzePgnModal({
    isOpen,
    onClose,
    onLoadPgn,
}: AnalyzePgnModalProps) {
    const { t } = useTranslation()
    const [pgnInput, setPgnInput] = useState<string>('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    if (!isOpen) return null

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            const content = event.target?.result as string
            if (content) {
                onLoadPgn(content)
                onClose()
                setPgnInput('')
            }
        }
        reader.readAsText(file)
        e.target.value = ''
    }

    const handleSubmit = () => {
        if (!pgnInput.trim()) return
        onLoadPgn(pgnInput.trim())
        onClose()
        setPgnInput('')
    }

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                accept=".pgn,.txt"
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
            />

            <div className={styles.modalBackdrop} onClick={onClose}>
                <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                        <h3>
                            <ScrollText size={18} />
                            {t('load_pgn')}
                        </h3>
                        <button
                            type="button"
                            className={styles.modalCloseBtn}
                            onClick={onClose}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className={styles.modalBody}>
                        <div
                            className={styles.pgnDropzone}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <ScrollText size={32} color="#38BDF8" />
                            <span style={{ fontWeight: 600, color: '#F1F5F9' }}>
                                {t('choose_pgn_file')}
                            </span>
                            <span style={{ fontSize: 11, color: '#94A3B8' }}>
                                Supports standard .pgn and text notation files
                            </span>
                        </div>

                        <textarea
                            className={styles.pgnTextarea}
                            placeholder={t('or_paste_pgn')}
                            value={pgnInput}
                            onChange={(e) => setPgnInput(e.target.value)}
                        />
                    </div>

                    <div className={styles.modalFooter}>
                        <button
                            type="button"
                            className={styles.submitBtn}
                            disabled={!pgnInput.trim()}
                            onClick={handleSubmit}
                        >
                            {t('load_and_analyze')}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
