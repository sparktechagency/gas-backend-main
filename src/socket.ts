import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import getUserDetailsFromToken from './app/helpers/getUserDetailsFromToken';
import AppError from './app/error/AppError'; 
import { Types } from 'mongoose';
import { IUser } from './app/modules/user/user.interface';
import { User } from './app/modules/user/user.models';
import Message from './app/modules/messages/messages.models';
import { chatService } from './app/modules/chat/chat.service';
import { IChat } from './app/modules/chat/chat.interface';
import Chat from './app/modules/chat/chat.models';  
import { callbackFn } from './app/utils/callbackFn';
import { messagesService } from './app/modules/messages/messages.service';
import { sendLocationToKafka } from './kafka/producer';

// const setUserId = new Map<string, string>()
// const setSocketId = new Map<string, string>()

// function getSocketId(userid:string){
//   setSocketId.get(userid)
// }

// function getUserId(socketid:string){
//   setUserId.get(socketid)
// }


const initializeSocketIO = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  // Online users
  const onlineUser = new Set();

  io.on('connection', async socket => { 
    console.log('connected', socket?.id);

    try {
      //----------------------user token get from front end-------------------------//
      const token =
        socket.handshake.auth?.token || socket.handshake.headers?.token;

      console.log('---------------', token);
      //----------------------check Token and return user details-------------------------//
      const user: any = await getUserDetailsFromToken(token);
      if (!user) {
        // io.emit('io-error', {success:false, message:'invalid Token'});
        throw new AppError(400, 'Invalid token');
      }

      socket.join(user?._id?.toString());
      // if(socket?.id && user?._id){
      //   setSocketId.set(user?._id, socket?.id)
      //   setUserId.set(socket?.id, user?._id)
  
      // }

      //----------------------user id set in online array-------------------------//
      onlineUser.add(user?._id?.toString());

      socket.on('check', (data, callback) => {
        console.log(data);

        callbackFn(callback, { success: true });
      });

      //----------------------online array send for front end------------------------//
      io.emit('onlineUser', Array.from(onlineUser));

      //-------------------------------Join Order Room -----------------------------//
      socket.on('joinOrderRoom', (orderId: string) => {
        const room = `order-room::${orderId}`;
        socket.join(room);
        console.log(`📍 Order joined room: ${room}`);
      });
 //-------------------------------get location -----------------------------//
 socket.on('getLocation', async (data, cb) => {
  await sendLocationToKafka(data.orderId, data.latitude, data.longitude);
});

      //----------------------user details and messages send for front end -->(as need to use)------------------------//
      socket.on('message-page', async (userId, callback) => {
        if (!userId) {
          callbackFn(callback, {
            success: false,
            message: 'userId is required',
          });
        }

        try {
          const receiverDetails: IUser | null = await User.findById(
            userId,
          ).select('_id email role image name');

          if (!receiverDetails) {
            callbackFn(callback, {
              success: false,
              message: 'user is not found!',
            });
            io.emit('io-error', {
              success: false,
              message: 'user is not found!',
            });
          }
          const payload = {
            _id: receiverDetails?._id,
            email: receiverDetails?.email,
            image: receiverDetails?.image,
            role: receiverDetails?.role,
            name: receiverDetails?.fullname,
          };

          socket.emit('user-details', payload);

          const getPreMessage = await Message.find({
            $or: [
              { sender: user?._id, receiver: userId },
              { sender: userId, receiver: user?._id },
            ],
          }).sort({ updatedAt: 1 });

          socket.emit('message', getPreMessage || []);

          Notification;
          const allUnReaddMessage = await Message.countDocuments({
            receiver: user?._id,
            seen: false,
          });
          const variable = 'new-notifications::' + user?._id;
          io.emit(variable, allUnReaddMessage);

          const allUnReaddMessage2 = await Message.countDocuments({
            receiver: userId,
            seen: false,
          });
          const variable2 = 'new-notifications::' + userId;
          io.emit(variable2, allUnReaddMessage2);

          //end Notification//
        } catch (error: any) {
          callbackFn(callback, {
            success: false,
            message: error.message,
          });
          io.emit('io-error', { success: false, message: error });
          console.error('Error in message-page event:', error);
        }
      });

      // -----------------------------live traking---------------------------------

      //----------------------user id set in online array-------------------------//
      onlineUser.add(user?._id?.toString());

      socket.on('check', (data, callback) => {
        callback({ success: true });
      });

      socket.on(
        'getLocation',
        async (
          data: { latitude: number; longitude: number, orderId:string},
          callback: any,
        ) => await sendLocationToKafka(data.orderId, data.latitude, data.longitude)
      );
      //----------------------chat list------------------------//
      socket.on('my-chat-list', async (data, callback) => {
        try {
          const chatList = await chatService.getMyChatList(user?._id);
          const myChat = 'chat-list::' + user?._id;

          io.emit(myChat, chatList);

          callbackFn(callback, { success: true, message: chatList });
        } catch (error: any) {
          callbackFn(callback, {
            success: false,
            message: error.message,
          });
          io.emit('io-error', { success: false, message: error.message });
        }
      });

      //----------------------seen message-----------------------//
      socket.on('seen', async ({ chatId }:{chatId:string}, callback) => {
        if (!chatId) {
          callbackFn(callback, {
            success: false,
            message: 'chatId id is required',
          });
          io.emit('io-error', {
            success: false,
            message: 'chatId id is required',
          });
        }

        try {
          const chatList: IChat | null = await Chat.findById(chatId);
          if (!chatList) {
            callbackFn(callback, {
              success: false,
              message: 'chat id is not valid',
            });
            io.emit('io-error', {
              success: false,
              message: 'chat id is not valid',
            });
            throw new AppError(400, 'chat id is not valid');
          }

          const messageIdList = await Message.aggregate([
            {
              $match: {
                chat: new Types.ObjectId(chatId),
                seen: false,
                sender: { $ne: new Types.ObjectId(user?._id) },
              },
            },
            { $group: { _id: null, ids: { $push: '$_id' } } },
            { $project: { _id: 0, ids: 1 } },
          ]);
          const unseenMessageIdList =
            messageIdList.length > 0 ? messageIdList[0].ids : [];

          const updateMessages = await Message.updateMany(
            { _id: { $in: unseenMessageIdList } },
            { $set: { seen: true } },
          );

          const user1 = chatList.participants[0];
          const user2 = chatList.participants[1];
          // //----------------------ChatList------------------------//
          const ChatListUser1 = await chatService.getMyChatList(
            user1.toString(),
          );

          const ChatListUser2 = await chatService.getMyChatList(
            user2.toString(),
          );

          const user1Chat = 'chat-list::' + user1;

          const user2Chat = 'chat-list::' + user2;

          const allUnReaddMessage = await Message.countDocuments({
            receiver: user1,
            seen: false,
          });
          const variable = 'new-notifications::' + user1;
          io.emit(variable, allUnReaddMessage);

          const allUnReaddMessage2 = await Message.countDocuments({
            receiver: user2,
            seen: false,
          });
          const variable2 = 'new-notifications::' + user2;
          io.emit(variable2, allUnReaddMessage2);

          const getPreMessage = await Message.find({
            $or: [
              { sender: user1, receiver: user2 },
              { sender: user2, receiver: user1 },
            ],
          }).sort({ updatedAt: 1 });

          socket.emit('message', getPreMessage || []);

          io.emit(user1Chat, ChatListUser1);
          io.emit(user2Chat, ChatListUser2);
        } catch (error: any) {
          callbackFn(callback, {
            success: false,
            message: error.message,
          });
          console.error('Error in seen event:', error);
          socket.emit('error', { message: error.message });
        }
      });
      //----------------------send message-----------------------//
      socket.on('send-message', async (payload, callback) => {
        payload.sender = user?._id;

        const alreadyExists = await Chat.findOne({
          participants: { $all: [payload.sender, payload.receiver] },
        }).populate(['participants']);

        if (!alreadyExists) {
          const chatList = await Chat.create({
            participants: [payload.sender, payload.receiver],
          });

          payload.chat = chatList?._id;
        } else {
          payload.chat = alreadyExists?._id;
        }

        const result = await Message.create(payload);

        if (!result) {
          callbackFn(callback, {
            statusCode: 400,
            success: false,
            message: 'Message sent failed',
          });
        }

        const senderMessage = 'new-message::' + result.chat.toString();

        io.emit(senderMessage, result);

        // //----------------------ChatList------------------------//
        const ChatListSender = await chatService.getMyChatList(
          result?.sender.toString(),
        );
        const senderChat = 'chat-list::' + result.sender.toString();
        io.emit(senderChat, ChatListSender);

        const ChatListReceiver = await chatService.getMyChatList(
          result?.receiver.toString(),
        );

        const receiverChat = 'chat-list::' + result.receiver.toString();

        io.emit(receiverChat, ChatListReceiver);

        // Notification
        const allUnReaddMessage = await Message.countDocuments({
          receiver: result.sender,
          seen: false,
        });
        const variable = 'new-notifications::' + result.sender;
        io.emit(variable, allUnReaddMessage);
        const allUnReaddMessage2 = await Message.countDocuments({
          receiver: result.receiver,
          seen: false,
        });
        const variable2 = 'new-notifications::' + result.receiver;
        io.emit(variable2, allUnReaddMessage2);
        const data = await messagesService.getMessagesByUniqueUser(user?._id);
        const vars = 'get-message-notification::' + user?._id;
        io.emit(vars, data);
        //end Notification//
        callbackFn(callback, {
          statusCode: 200,
          success: true,
          message: 'Message sent successfully!',
          data: result,
        });
      });

      //-----------------------Typing------------------------//
      socket.on('typing', function (data) {
        const chat = 'typing::' + data.chatId.toString();
        const message = user?.name + ' is typing...';
        socket.emit(chat, { message: message });
      });
      socket.on('stopTyping', function (data) {
        const chat = 'stopTyping::' + data.chatId.toString();
        const message = user?.name + ' is stop typing...';
        socket.emit(chat, { message: message });
      });

      //-----------------------Seen All------------------------//
      socket.on('message-notification', async ({}, callback) => {
        try {
          const allUnReaddMessage = await Message.countDocuments({
            receiver: user?._id,
            seen: false,
          });
          const variable = 'new-notifications::' + user?._id;
          io.emit(variable, allUnReaddMessage);
          callbackFn(callback, { success: true, message: allUnReaddMessage });
        } catch (error) {
          callbackFn(callback, {
            statusCode: 400,
            success: false,
            message: 'Failed to retrieve notifications',
          });
        }
      });

      socket.on('get-unique-user', async ({}, callback) => {
        const data = await messagesService.getMessagesByUniqueUser(user?._id);
        const vars = 'get-message-notification::' + user?._id;
        io.emit(vars, data);
        callbackFn(callback, { success: true, message: data });
      });
      //-----------------------Disconnect------------------------//
      socket.on('disconnect', () => {
        onlineUser.delete(user?._id?.toString());
        io.emit('onlineUser', Array.from(onlineUser));
        console.log('disconnect user ', socket.id);
      });
    } catch (error) {
      console.error('-- socket.io connection error --', error);
    }
  });

  return io;
};

export default initializeSocketIO;
