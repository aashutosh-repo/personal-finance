import { PaymentMethod, PaymentProvider } from './payment.model';

export interface PaymentProviderMetadata {
  provider: PaymentProvider;
  displayName: string;
  supportedMethods: PaymentMethod[];
}
