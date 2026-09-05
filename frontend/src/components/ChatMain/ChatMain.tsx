import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ChatObject } from '../ChatSidebar/ChatSidebar'
import styles from './ChatMain.module.css'

export type Message = {
    id: number
    chat_id: string
    sender_id: number
    content: string
    created_at: string
    sender?: { id: number; username: string; avatar?: string }
}

type Props = {
    selectedChat: ChatObject | null
    messages: Message[]
    newMessage: string
    currentUserId: number | null
    onNewMessageChange: (value: string) => void
    onSendMessage: () => void
}

function ChatMain({
    selectedChat,
    messages,
    newMessage,
    currentUserId,
    onNewMessageChange,
    onSendMessage,
}: Props) {
    const { t } = useTranslation()
    const navigate = useNavigate()

    const getOtherUser = (chat: ChatObject) => {
        if (!currentUserId) return null
        return chat.user1_id === currentUserId ? chat.user2 : chat.user1
    }

    const otherUser = selectedChat ? getOtherUser(selectedChat) : null

    return (
        <div className={styles.chatMain}>
            {selectedChat ? (
                <>
                    <div
                        className={styles.chatMainHeader}
                        onClick={() => {
                            if (otherUser) {
                                navigate(`/profile/${otherUser.username}`)
                            }
                        }}
                    >
                        <img
                            src={otherUser?.avatar ? `/uploads/${otherUser.avatar}` : '/assets/default.jpg'}
                            alt={otherUser?.username}
                            className={styles.chatMainAvatar}
                        />
                        <h3>{otherUser?.username}</h3>
                    </div>

                    <div className={styles.chatMessages}>
                        {messages.map(msg => (
                            <div
                                key={msg.id}
                                className={`${styles.message} ${msg.sender_id === currentUserId ? styles.sent : styles.received}`}
                            >
                                <div className={styles.messageBubble}>{msg.content}</div>
                                <div className={styles.messageTime}>
                                    {new Date(msg.created_at).toLocaleTimeString()}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.chatInputArea}>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={e => onNewMessageChange(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && onSendMessage()}
                            placeholder={t('type_message')}
                        />
                        <button onClick={onSendMessage}>{t('send')}</button>
                    </div>
                </>
            ) : (
                <div className={styles.noChatSelected}>
                    <p>{t('select_chat')}</p>
                </div>
            )}
        </div>
    )
}

export default ChatMain