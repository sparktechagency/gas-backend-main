import { Model, ObjectId } from 'mongoose';

export interface Idelivery {
  _id?: ObjectId;
  userId: ObjectId;
  orderId: ObjectId;
  status: 'accept' | 'ontheway' | 'delivered';
  proofImage: string;
}

export interface IDeliveryModel extends Model<Idelivery> {
  getByOrderId(orderId: string): Promise<Idelivery>;
}
