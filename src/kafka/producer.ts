// kafka/producer.ts
import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'rider-location-app',
  brokers: ['localhost:9092'],
});

export const producer = kafka.producer();

export const sendLocationToKafka = async (
  orderId: string,
  latitude: number,
  longitude: number
) => {
  await producer.send({
    topic: 'deliveryman-location',
    messages: [
      {
        key: orderId,
        value: JSON.stringify({ orderId, latitude, longitude }),
      },
    ],
  });
};
