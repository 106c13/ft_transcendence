export type ChatObject = {
	id: number;
	chat_id: string;
	user1_id: number;
	user2_id: number;
	user1: { id: number; username: string; avatar?: string; status?: string };
	user2: { id: number; username: string; avatar?: string; status?: string };
	unreadCount?: number;
	lastMessage?: { id?: number; content?: string; created_at?: string; sender_id?: number } | string | null;
};

export type Message = {
	id: number;
	chat_id: string;
	sender_id: number;
	content: string;
	created_at: string;
	sender?: { id: number; username: string; avatar?: string };
};

export type Friend = {
	id: number;
	username: string;
	avatar: string | null;
	status?: string;
};
