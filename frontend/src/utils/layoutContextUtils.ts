import type { User } from './profileUtils'
import type { ChallengeStatus, ChallengeReceived, ChallengeSent } from './challengeUtils'

export type ChallengeSocketType = {
    challengeStatus: ChallengeStatus
    challengeError: string
    incomingChallenge: ChallengeReceived | null
    outgoingChallenge: ChallengeSent | null
    challengeCountdown: number
    incomingCountdown: number
    outgoingCountdown: number
    sendChallenge: (friendUsername: string, mode: string) => void
    sendRematch: (previousGameId: string) => void
    acceptChallenge: (challengeId: string) => void
    declineChallenge: (challengeId: string) => void
    resetChallengeStatus: () => void
}

export type FriendSocketType = {
    friends: User[];
    loadFriends: () => void;
    sendFriendRequest: (friendUsername: string) => void;
    acceptFriendRequest: (friendUsername: string) => void;
    rejectFriendRequest: (friendUsername: string) => void;
    cancelFriendRequest: (friendUsername: string) => void;
    unfriend: (friendUsername: string) => void;
    viewProfile: (username: string) => void;
    leaveProfile: (username: string) => void;
};

export type LayoutContextType = {
    currentUser: User | null
    setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>
    challengeSocket: ChallengeSocketType
    friendSocket: FriendSocketType
}