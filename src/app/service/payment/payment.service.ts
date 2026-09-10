import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Payment, PaymentRequest } from '../../model/payment.model';
import { PaymentProviderMetadata } from '../../model/payment-provider.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/payments`;

  createPayment(request: PaymentRequest): Observable<Payment> {
    return this.http.post<Payment>(this.baseUrl, request, { withCredentials: true });
  }

  getProviders(): Observable<PaymentProviderMetadata[]> {
    return this.http.get<PaymentProviderMetadata[]>(`${this.baseUrl}/providers`, { withCredentials: true });
  }

  validateUpiId(upiId: string): Observable<{ valid: boolean; message: string }> {
    return this.http.post<{ valid: boolean; message: string }>(`${this.baseUrl}/upi/validate`, { upiId }, { withCredentials: true });
  }

  getPayment(paymentId: string): Observable<Payment> {
    return this.http.get<Payment>(`${this.baseUrl}/${paymentId}`, { withCredentials: true });
  }
}
