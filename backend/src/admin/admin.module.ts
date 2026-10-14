import { DynamicModule, Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '@/users/user.entity';
import { UserRating } from '@/users/user-rating.entity';
import { Chat } from '@/chat/chat.entity';
import { Message } from '@/messages/messages.entity';
import { Match } from '@/game/match.entity';
import { FriendRequest } from '@/friends/friend-request.entity';
import { Friendship } from '@/friends/friendship.entity';
import { Notification } from '@/notification/notification.entity';

// Prevents TypeScript from turning dynamic import() into require()
const dynamicImport = new Function('specifier', 'return import(specifier)') as (
    specifier: string,
) => Promise<any>;

async function createAdminModule(): Promise<DynamicModule> {
    const { default: AdminJS } = await dynamicImport('adminjs');
    const { Database, Resource } = await dynamicImport('@adminjs/typeorm');
    const { AdminModule: AdminJSNestModule } = await dynamicImport('@adminjs/nestjs');

    AdminJS.registerAdapter({ Database, Resource });

    return AdminJSNestModule.createAdminAsync({
        inject: [DataSource],
        useFactory: (dataSource: DataSource) => ({
            adminJsOptions: {
                rootPath: '/admin',
                resources: [
                    {
                        resource: User,
                        options: {
                            properties: {
                                password: { isVisible: { list: false, edit: true, filter: false } },
                                avatar: { isVisible: { list: false, edit: true, filter: false } },
                                bio: { isVisible: { list: true, edit: true, filter: true } },
                            },
                        },
                    },
                    {
                        resource: UserRating,
                        options: {
                            listProperties: ['id', 'user', 'category', 'rating', 'games_played', 'wins', 'losses', 'draws', 'is_provisional'],
                        },
                    },
                    {
                        resource: Chat,
                        options: {
                            listProperties: ['id', 'chat_id', 'user1', 'user2', 'created_at'],
                        },
                    },
                    {
                        resource: Message,
                        options: {
                            listProperties: ['id', 'chat_id', 'sender', 'content', 'is_read', 'created_at'],
                            properties: {
                                content: { type: 'textarea' },
                            },
                        },
                    },
                    {
                        resource: Match,
                        options: {
                            listProperties: ['id', 'white', 'black', 'winner', 'mode', 'result', 'played_at'],
                            properties: {
                                pgn: { isVisible: { list: false, edit: true, filter: false } },
                                analysis: { isVisible: { list: false, edit: true, filter: false } },
                                move_times: { isVisible: { list: false, edit: false, filter: false } },
                            },
                        },
                    },
                    {
                        resource: FriendRequest,
                        options: {
                            listProperties: ['id', 'sender', 'receiver', 'status', 'created_at'],
                        },
                    },
                    {
                        resource: Friendship,
                        options: {
                            listProperties: ['id', 'user1', 'user2', 'created_at'],
                        },
                    },
                    {
                        resource: Notification,
                        options: {
                            listProperties: ['id', 'user', 'message', 'link', 'is_read', 'created_at'],
                        },
                    },
                ],
                branding: { 
                    companyName: 'Transcendence Admin',
                    softwareBrothers: false,
                },
            },
            auth: {
                authenticate: async (email: string, password: string) => {
                    const user = await dataSource.getRepository(User).findOne({ where: { email } });
                    if (!user || !user.is_admin) return null;

                    const match = await bcrypt.compare(password, user.password);
                    if (!match) return null;

                    return { email: user.email, id: user.id.toString() };
                },
                cookieName: 'adminjs',
                cookiePassword:
                    process.env.ADMIN_COOKIE_PASSWORD || 'super-secret-cookie-key-change-in-prod',
            },
            sessionOptions: {
                resave: false,
                saveUninitialized: false,
                secret: process.env.ADMIN_COOKIE_PASSWORD || 'super-secret-cookie-key-change-in-prod',
            },
        }),
    });
}

@Module({
    imports: [createAdminModule()],
})
export class AdminModule { }