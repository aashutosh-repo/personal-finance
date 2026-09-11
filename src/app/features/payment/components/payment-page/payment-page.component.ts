import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { Payment, PaymentProvider, PaymentRequest, PaymentState } from '../../../../model/payment.model';
import { PaymentProviderMetadata } from '../../../../model/payment-provider.model';
import { PaymentService } from '../../../../service/payment/payment.service';

@Component({
  selector: 'app-payment-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './payment-page.component.html',
  styleUrl: './payment-page.component.scss'
})
export class PaymentPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly paymentService = inject(PaymentService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly paymentForm: FormGroup = this.fb.group({});
  readonly orderSummary = {
    merchant: 'Finance Tracker',
    product: 'Premium Finance Suite',
    tax: 269.82,
    subtotal: 1499.0,
    total: 1768.82,
    currency: '₹',
    orderId: 'ORD-10001'
  };

  paymentState: PaymentState = 'IDLE';
  paymentResponse: Payment | null = null;
  availableProviders: PaymentProviderMetadata[] = [];
  selectedProvider: PaymentProvider = 'PAYU';
  errorMessage = '';
  isSubmitted = false;

  ngOnInit(): void {
    this.loadProviderReturn();
    this.paymentService.getProviders().subscribe({
      next: (providers) => {
        this.availableProviders = providers;
        if (!providers.some((provider) => provider.provider === this.selectedProvider)) {
          this.selectedProvider = providers[0]?.provider ?? 'PAYU';
        }
      },
      error: () => {
        this.availableProviders = [];
      }
    });
  }

  get isProcessing(): boolean {
    return this.paymentState === 'CREATING_PAYMENT'
      || this.paymentState === 'PROCESSING'
      || this.paymentState === 'AWAITING_PAYMENT';
  }

  get statusTextClass(): string {
    if (this.isProcessing) {
      return 'processing';
    }
    if (this.paymentState === 'FAILED' || this.paymentState === 'EXPIRED' || this.paymentState === 'CANCELLED') {
      return 'failed';
    }
    return '';
  }

  get selectedProviderName(): string {
    return this.availableProviders.find((provider) => provider.provider === this.selectedProvider)?.displayName
      ?? 'PayU';
  }

  submitPayment(): void {
    if (this.isProcessing || this.isSubmitted) {
      return;
    }

    this.isSubmitted = true;
    this.paymentState = 'CREATING_PAYMENT';
    this.errorMessage = '';

    const payload: PaymentRequest = {
      orderId: this.orderSummary.orderId,
      amount: this.orderSummary.total,
      currency: 'INR',
      provider: this.selectedProvider,
      idempotencyKey: `pay-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
    };

    this.paymentService.createPayment(payload)
      .pipe(finalize(() => {
        this.isSubmitted = false;
      }))
      .subscribe({
        next: (response) => {
          this.paymentResponse = response;
          if (response.checkoutUrl && response.checkoutFields) {
            this.paymentState = 'AWAITING_PAYMENT';
            this.startHostedCheckout(response);
            return;
          }

          this.paymentState = response.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED';
          this.errorMessage = response.status === 'SUCCESS'
            ? ''
            : 'We couldn\'t start your payment. Please try again.';
        },
        error: () => {
          this.paymentState = 'FAILED';
          this.errorMessage = 'We couldn\'t start your payment. Please try again.';
        }
      });
  }

  resetPaymentState(): void {
    this.paymentState = 'IDLE';
    this.paymentResponse = null;
    this.errorMessage = '';
    this.isSubmitted = false;
  }

  goHome(): void {
    this.router.navigate(['/v1/dashboard']);
  }

  private loadProviderReturn(): void {
    this.route.queryParamMap.subscribe((params) => {
      const paymentId = params.get('paymentId');
      if (!paymentId) {
        return;
      }

      this.paymentState = 'PROCESSING';
      this.errorMessage = 'Confirming your payment...';
      this.paymentService.getPayment(paymentId).subscribe({
        next: (payment) => {
          this.paymentResponse = payment;
          this.paymentState = payment.status === 'SUCCESS'
            ? 'SUCCESS'
            : payment.status === 'FAILED'
              ? 'FAILED'
              : payment.status === 'EXPIRED'
                ? 'EXPIRED'
                : 'PROCESSING';
          this.errorMessage = payment.status === 'SUCCESS'
            ? ''
            : payment.status === 'FAILED'
              ? 'We couldn\'t complete your payment. Please try again.'
              : payment.status === 'EXPIRED'
                ? 'This payment session has expired. Please try again.'
                : 'Your payment is still being confirmed.';
          this.router.navigate([], { queryParams: {}, replaceUrl: true });
        },
        error: () => {
          this.paymentState = 'FAILED';
          this.errorMessage = 'We couldn\'t confirm your payment. Please try again.';
        }
      });
    });
  }

  private startHostedCheckout(response: Payment): void {
    if (!response.checkoutUrl || !response.checkoutFields) {
      return;
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = response.checkoutUrl;
    form.style.display = 'none';

    Object.entries(response.checkoutFields).forEach(([name, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  }
}
