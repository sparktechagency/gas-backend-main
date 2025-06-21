import Stripe from 'stripe';
import config from '../../config';
import { MonthlyIncome, MonthlyUsers } from './payments.interface';
import moment from 'moment';

const stripe: Stripe = new Stripe(config.stripe?.stripe_api_secret as string, {
  apiVersion: '2024-06-20',
  typescript: true,
});
interface IPayload {
  product: {
    amount: number;
    name: string;
    quantity: number;
  };
  // customerId: string;
  paymentId: string;
}
export const createCheckoutSession = async (payload: IPayload) => {
  const paymentGatewayData = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: payload?.product?.name,
          },
          unit_amount: payload.product?.amount * 100,
        },
        quantity: payload.product?.quantity,
      },
    ],

    success_url: `${config?.webhook_url}?sessionId={CHECKOUT_SESSION_ID}&paymentId=${payload?.paymentId}`,

    cancel_url: config?.cancel_url,

    // `${config.server_url}/payments/cancel?paymentId=${payload?.paymentId}`,
    mode: 'payment',
    // metadata: {
    //   user: JSON.stringify({
    //     paymentId: payment.id,
    //   }),
    // },
    invoice_creation: {
      enabled: true,
    },
    // customer: payload?.customerId,
    // payment_intent_data: {
    //   metadata: {
    //     payment: JSON.stringify({
    //       ...payment,
    //     }),
    //   },
    // },
    // payment_method_types: ['card', 'amazon_pay', 'cashapp', 'us_bank_account'],
    payment_method_types: ['card'],
  });
  return paymentGatewayData;
};


// Overloads
export function initializeMonthlyData(key: 'income'): MonthlyIncome[];
export function initializeMonthlyData(key: 'total'): MonthlyUsers[];

// Implementation
export function initializeMonthlyData(
  key: 'income' | 'total',
): (MonthlyIncome | MonthlyUsers)[] {
  return Array.from({ length: 12 }, (_, index) => ({
    month: moment().month(index).format('MMM'),
    [key]: 0,
  })) as any; // Safe because overloads control output type
}