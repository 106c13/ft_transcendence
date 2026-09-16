import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "@/users/user.entity";

export type UserOnlineStatus = 'ONLINE' | 'INGAME' | 'OFFLINE';

@Injectable()
export class PresenceService implements OnApplicationBootstrap {
    private userSockets = new Map<number, Set<string>>();
    private inGameUsers = new Set<number>();

    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) {}

    async onApplicationBootstrap() {
        try {
            await this.userRepo
                .createQueryBuilder()
                .update(User)
                .set({is_active: false})
                .where('is_active = :active', { active: true })
                .execute();
            console.log('PresenceService: Reset stale active statuses on bootstrap');
        } catch (err) {
            console.error('PresenceService: Failed to reset active statuses on bootstrap:', err);
        }
    }

    async handleUserConnect(userId: number, socketId: string): Promise<boolean> {
        let sockets = this.userSockets.get(userId);
        const isFirstConnection = !sockets || sockets.size === 0;

        if (!sockets)
        {
            sockets = new Set<string>();
            this.userSockets.set(userId, sockets);
        }
        sockets.add(socketId);

        if (isFirstConnection) {
            try {
                await this.userRepo.update(userId, {
                    is_active: true,
                    last_seen: new Date(),
                });
            } catch (err) {
                console.error(`PresenceService: Failed to mark user ${userId} active:`, err);
            }
        }

        return isFirstConnection;
    }

    async handleUserDisconnect(userId: number, socketId: string): Promise<boolean> {
        const sockets = this.userSockets.get(userId);
        if (!sockets) return false;

        sockets.delete(socketId);
        if (sockets.size === 0)
        {
            this.userSockets.delete(userId);
            this.inGameUsers.delete(userId);
            try {
                await this.userRepo.update(userId, {
                    is_active: false,
                    last_seen: new Date(),
                });
            } catch (err) {
                console.error(`PresenceService: Failed to mark user ${userId} inactive:`, err);
            }
            return true;
        }
        return false;
    }

    setUserInGame(userId: number, inGame: boolean): void {
        if (inGame) {
            this.inGameUsers.add(userId);
        } else {
            this.inGameUsers.delete(userId);
        }
    }

    getUserStatus(userId: number): UserOnlineStatus {
        const sockets = this.userSockets.get(userId);
        if (sockets && sockets.size > 0)
        {
            if (this.inGameUsers.has(userId)) {
                return 'INGAME';
            }
            return 'ONLINE';
        }
        return 'OFFLINE';
    }

    isUserOnline(userId: number): boolean {
        const sockets = this.userSockets.get(userId);
        return !!(sockets && sockets.size > 0);
    }
}
