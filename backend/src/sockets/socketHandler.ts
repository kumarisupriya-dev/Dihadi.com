import {Server, Socket} from 'socket.io';
import mongoose from 'mongoose';
import Message from '../models/Message';

const onlineUsers = new Map<string, string>();
const userSockets = new Map<string, string>();
const activeRoomUsers = new Map<string, Set<string>>();

export const setupSockets = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        console.log(`User connected to socket: ${socket.id}`);

        socket.on('register_active_user', (data: {userId: string, taskId: string}) => {
            const {userId, taskId} = data;
            onlineUsers.set(userId, socket.id);
            userSockets.set(socket.id, userId);
            io.to(taskId).emit('user_status_update', {userId, isOnline: true});
        });

        socket.on('check_user_online', (data: {targetUserId: string}, callback: (isOnline: boolean) => void) => {
            const isOnline = onlineUsers.has(data.targetUserId);
            callback(isOnline);
        });

        socket.on('join_room', async(taskId: string) => {
            socket.join(taskId);
            console.log(`Socket ${socket.id} joined chat room: ${taskId}`);

            const userId = userSockets.get(socket.id);
            if (userId) {
                if (!activeRoomUsers.has(taskId)) {
                    activeRoomUsers.set(taskId, new Set());
                }
                activeRoomUsers.get(taskId)!.add(userId);

                await Message.updateMany(
                    {task: taskId, sender: {$ne: userId}, read: false},
                    {$set: {read: true}}
                );

                io.to(taskId).emit('message_read', {taskId});
            }
        });

        socket.on('leave_room', (taskId: string) => {
            socket.leave(taskId);
            const userId = userSockets.get(socket.id);
            if (userId && activeRoomUsers.has(taskId)) {
                activeRoomUsers.get(taskId)!.delete(userId);
                if (activeRoomUsers.get(taskId)!.size === 0) {
                    activeRoomUsers.delete(taskId);
                }
            }
        });

        socket.on('share_location', (data: {taskId: string; coordinated: [number, number]}) => {
            io.to(data.taskId).emit('location_update', data.coordinated);
        });

        socket.on('send_message', async (data: {taskId: string; senderId: string; text?: string; attachment?: string; audio?: string}) => {
            try {
                const {taskId, senderId, text, attachment, audio} = data;

                const isRoomActive = activeRoomUsers.get(taskId)?.size && activeRoomUsers.get(taskId)!.size >= 2;

                const message = new Message({
                    task: taskId,
                    sender: senderId,
                    text,
                    attachment,
                    audio,
                    read: isRoomActive ? true : false
                });
                await message.save();
                const populatedMessage = await message.populate('sender', 'name');
                io.to(taskId).emit('receive_message', populatedMessage);
            } catch (err) {
                console.error('Socket message error:', err);
            }
        });

        socket.on('add_reaction', async (data: {messageId: string; userId: string; emoji: string}) => {
            try {
                const {messageId, userId, emoji} = data;
                const msg = await Message.findById(messageId);
                if (!msg) return;

                if (!msg.reactions) {
                    msg.reactions = [];
                }
                const existingIdx = msg.reactions.findIndex(r => r.user.toString() === userId);

                if (existingIdx > -1) {
                    if (msg.reactions[existingIdx].emoji === emoji) {
                        msg.reactions.splice(existingIdx, 1);
                    } else {
                        msg.reactions[existingIdx].emoji = emoji;
                    }
                } else {
                    msg.reactions.push({user: new mongoose.Types.ObjectId(userId) as any, emoji});
                }
                await msg.save();

                const populatedMsg = await msg.populate([
                    {path: 'sender', select: 'name'},
                    {path: 'reactions.user', select: 'name'}
                ]);
                io.to(msg.task.toString()).emit('reactions_updated', populatedMsg);
            } catch (err) {
                console.error('Socket reaction error:', err);
            }
        });

        socket.on('typing_status', (data: {taskId: string; userId: string; name: string; isTyping: boolean}) => {
            socket.to(data.taskId).emit('typing_update', data);
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
            const userId = userSockets.get(socket.id);
            if (userId) {
                onlineUsers.delete(userId);
                userSockets.delete(socket.id);
                io.emit('user_status_update', {userId, isOnline: false});

                for (const [taskId, usersSet] of activeRoomUsers.entries()) {
                    if (usersSet.has(userId)) {
                        usersSet.delete(userId);
                        if (usersSet.size === 0) {
                            activeRoomUsers.delete(taskId);
                        }
                    }
                }
            }
        });
    });
};