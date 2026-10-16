import { DynamicModule, Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
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
    const { default: AdminJS, flat, ValidationError } = await dynamicImport('adminjs');
    const { Database, Resource } = await dynamicImport('@adminjs/typeorm');
    const { AdminModule: AdminJSNestModule } = await dynamicImport('@adminjs/nestjs');
    const { dark } = await dynamicImport('@adminjs/themes');

    const jsonFields = ['analysis', 'move_times'];
    const truncate = (s: string, max = 80) => (s.length > max ? s.slice(0, max) + '…' : s);

    // Show page only: short, single-line previews
    const jsonPreview = async (response: any, request: any) => {
        if (request.method === 'get' && response.record) {
            const params = response.record.params;

            for (const field of jsonFields) {
                const value = flat.get(params, field);
                for (const key of Object.keys(params)) {
                    if (key === field || key.startsWith(`${field}.`)) delete params[key];
                }
                params[field] = value == null ? '' : truncate(JSON.stringify(value));
            }

            if (typeof params.pgn === 'string') {
                params.pgn = truncate(params.pgn.replace(/\s+/g, ' '));
            }
        }
        return response;
    };

    // Before showing/editing: JSON -> pretty-printed string
    const jsonToText = async (response: any, request: any) => {
        if (request.method === 'get' && response.record) {
            const params = response.record.params;
            for (const field of jsonFields) {
                // AdminJS flattens nested values ("analysis.0.x"), so rebuild first
                const value = flat.get(params, field);
                for (const key of Object.keys(params)) {
                    if (key === field || key.startsWith(`${field}.`)) delete params[key];
                }
                params[field] = value == null ? '' : JSON.stringify(value, null, 2);
            }
        }
        return response;
    };

    // Before saving: string -> real JSON
    const textToJson = async (request: any) => {
        if (request.method === 'post' && request.payload) {
            const errors: Record<string, { message: string }> = {};
            for (const field of jsonFields) {
                const v = request.payload[field];
                if (typeof v !== 'string') continue;
                try {
                    request.payload[field] = v.trim() === '' ? null : JSON.parse(v);
                } catch {
                    errors[field] = { message: 'Invalid JSON' };
                }
            }
            if (Object.keys(errors).length) throw new ValidationError(errors);
        }
        return request;
    };

    AdminJS.registerAdapter({ Database, Resource });

    return AdminJSNestModule.createAdminAsync({
        inject: [DataSource],
        useFactory: (dataSource: DataSource) => ({
            adminJsOptions: {
                rootPath: '/admin',
                defaultTheme: dark.id,
                availableThemes: [dark],
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
                            // Newest matches first
                            sort: {
                                sortBy: 'played_at',
                                direction: 'desc',
                            },

                            // Compact table: no heavy fields
                            listProperties: ['id', 'white_id', 'black_id', 'winner_id', 'mode', 'result', 'played_at'],

                            // Show page: every field
                            showProperties: [
                                'id', 'white_id', 'black_id', 'winner_id', 'mode', 'result',
                                'pgn', 'analysis', 'move_times',
                                'white_rating_after', 'black_rating_after',
                                'white_rating_delta', 'black_rating_delta',
                                'played_at',
                            ],

                            // Edit/new page: every field (id is auto-generated)
                            editProperties: [
                                'white_id', 'black_id', 'winner_id', 'mode', 'result',
                                'pgn', 'analysis', 'move_times',
                                'white_rating_after', 'black_rating_after',
                                'white_rating_delta', 'black_rating_delta',
                                'played_at',
                            ],

                            properties: {
                                pgn: {
                                    type: 'textarea',
                                    props: { rows: 4 },
                                    isVisible: { list: false, show: true, edit: true, filter: false },
                                },
                                analysis: {
                                    type: 'textarea',
                                    props: { rows: 4 },
                                    isVisible: { list: false, show: true, edit: true, filter: false },
                                },
                                move_times: {
                                    type: 'textarea',
                                    props: { rows: 2 },
                                    isVisible: { list: false, show: true, edit: true, filter: false },
                                },
                            },
                            actions: {
                                show: { after: jsonPreview },
                                edit: { before: textToJson, after: jsonToText },
                                new: { before: textToJson },
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