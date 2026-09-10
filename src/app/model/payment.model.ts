export type PaymentStatus = 'CREATED' | 'INITIATED' | 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
export type PaymentMethod = 'CARD' | 'UPI' | 'NET_BANKING' | 'WALLET';
export type PaymentProvider = 'DUMMY' | 'PAYU' | 'RAZORPAY' | 'STRIPE' | 'ADYEN';
export type PaymentState = 'IDLE' | 'VERIFYING_UPI' | 'UPI_VERIFIED' | 'CREATING_PAYMENT' | 'AWAITING_PAYMENT' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
export type UpiFlowMode = 'UPI_ID' | 'SCAN_QR';

export interface Payment {
  paymentId: string;
  orderId: string;
  customerId?: string;
  amount: number;
  currency: string;
  paymentMethod?: PaymentMethod;
  status: PaymentStatus;
  provider?: PaymentProvider;
  providerPaymentId?: string;
  idempotencyKey?: string;
  createdAt?: string;
  updatedAt?: string;
  message?: string;
  upiId?: string;
  checkoutUrl?: string;
  checkoutFields?: Record<string, string>;
}

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  idempotencyKey: string;
  upiId?: string;
  provider?: PaymentProvider;
}

export interface PaymentErrorResponse {
  message: string;
  status?: number;
  error?: string;
  details?: Record<string, string>;
}
