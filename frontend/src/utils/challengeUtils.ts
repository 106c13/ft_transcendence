export interface ChallengeReceived {
    challengeId: string
    from: string
    mode: string
    isRematch?: boolean
}

export interface ChallengeSent {
    challengeId: string
    friendUsername: string
    mode: string
    isRematch?: boolean
}

export type ChallengeStatus = 'idle' | 'sending' | 'sent' | 'accepted' | 'declined' | 'expired' | 'error'