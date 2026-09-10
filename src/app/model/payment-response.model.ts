import { Payment, PaymentProvider } from './payment.model';

export interface PaymentResponse extends Payment {
  checkoutUrl?: string;
  checkoutFields?: Record<string, string>;
  provider?: PaymentProvider;
}
