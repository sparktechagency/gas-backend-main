// kafka/consumer.ts
import { Kafka } from 'kafkajs';
import { Server } from 'socket.io';

let io: Server;

export const setSocketServer = (socketServer: Server) => {
  io = socketServer;
};

const kafka = new Kafka({
  clientId: 'location-consumer',
  brokers: ['localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'order-group' });

export const consumeLocation = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'deliveryman-location', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!io) return;
      const data = JSON.parse(message.value!.toString());
      const room = `order-room::${data.orderId}`;

      io.to(room).emit('locationUpdate', {
        orderId: data.orderId,
        latitude: data.latitude,
        longitude: data.longitude,
      });
    },
  });
};
