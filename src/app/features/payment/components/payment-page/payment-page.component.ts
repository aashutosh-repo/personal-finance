import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { Payment, PaymentMethod, PaymentProvider, PaymentRequest, PaymentState, UpiFlowMode } from '../../../../model/payment.model';
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

  readonly paymentForm: FormGroup = this.fb.group({
    paymentMethod: ['CARD', Validators.required],
    cardNumber: [''],
    expiry: [''],
    cvv: [''],
    cardHolderName: [''],
    upiId: ['user@upi'],
    bankName: [''],
    accountNumber: [''],
    walletType: [''],
    walletNumber: [''],
    savePaymentMethod: [false]
  });

  readonly orderSummary = {
    merchant: 'Finance Tracker',
    product: 'Premium Finance Suite',
    tax: 269.82,
    subtotal: 1499.0,
    total: 1768.82,
    currency: '₹'
  };

  paymentState: PaymentState = 'IDLE';
  paymentResponse: Payment | null = null;
  availableProviders: PaymentProviderMetadata[] = [];
  selectedProvider: PaymentProvider = 'PAYU';
  upiFlowMode: UpiFlowMode = 'UPI_ID';
  errorMessage = '';
  isSubmitted = false;

  readonly paymentMethodOptions: Array<{ value: PaymentMethod; label: string }> = [
    { value: 'CARD', label: 'Card' },
    { value: 'UPI', label: 'UPI' },
    { value: 'NET_BANKING', label: 'Net Banking' },
    { value: 'WALLET', label: 'Wallet' }
  ];

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
    this.applyPaymentMethodValidators();
    this.paymentForm.get('paymentMethod')?.valueChanges.subscribe(() => {
      this.applyPaymentMethodValidators();
      this.clearError();
    });
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
          this.errorMessage = 'We couldn\'t confirm your payment. Please check your payment status and try again.';
        }
      });
    });
  }

  get supportedPaymentMethodOptions(): Array<{ value: PaymentMethod; label: string }> {
    const provider = this.availableProviders.find((item) => item.provider === this.selectedProvider);
    if (!provider) {
      return this.paymentMethodOptions;
    }
    return this.paymentMethodOptions.filter((option) => provider.supportedMethods.includes(option.value));
  }

  get selectedProviderName(): string {
    return this.availableProviders.find((provider) => provider.provider === this.selectedProvider)?.displayName ?? this.selectedProvider;
  }

  get isFormInvalid(): boolean {
    return this.paymentForm.invalid;
  }

  get selectedPaymentMethod(): PaymentMethod {
    return (this.paymentForm.get('paymentMethod')?.value ?? 'CARD') as PaymentMethod;
  }

  get isProcessing(): boolean {
    return this.paymentState === 'PROCESSING' || this.paymentState === 'VERIFYING_UPI' || this.paymentState === 'CREATING_PAYMENT' || this.paymentState === 'AWAITING_PAYMENT';
  }

  get statusTextClass(): string {
    if (this.paymentState === 'PROCESSING' || this.paymentState === 'VERIFYING_UPI' || this.paymentState === 'AWAITING_PAYMENT') {
      return 'processing';
    }
    if (this.paymentState === 'FAILED' || this.paymentState === 'EXPIRED' || this.paymentState === 'CANCELLED') {
      return 'failed';
    }
    return '';
  }

  get isPrimaryActionDisabled(): boolean {
    switch (this.selectedPaymentMethod) {
      case 'CARD':
        return this.paymentForm.invalid;
      case 'UPI':
        return this.paymentForm.get('upiId')?.invalid ?? true;
      case 'NET_BANKING':
        return Boolean(this.paymentForm.get('bankName')?.invalid) || Boolean(this.paymentForm.get('accountNumber')?.invalid);
      case 'WALLET':
        return Boolean(this.paymentForm.get('walletType')?.invalid) || Boolean(this.paymentForm.get('walletNumber')?.invalid);
      default:
        return true;
    }
  }

  get upiIdValue(): string {
    return (this.paymentForm.get('upiId')?.value ?? '').trim();
  }

  get paymentAmount(): number {
    return this.orderSummary.total;
  }

  onPaymentMethodChange(method: PaymentMethod): void {
    this.paymentForm.patchValue({ paymentMethod: method });
    this.applyPaymentMethodValidators();
    this.clearError();
    this.paymentState = 'IDLE';
    this.paymentResponse = null;
  }

  onProviderChange(provider: PaymentProvider): void {
    this.selectedProvider = provider;
    const supportedMethods = this.availableProviders.find((item) => item.provider === provider)?.supportedMethods ?? [];
    if (supportedMethods.length > 0 && !supportedMethods.includes(this.selectedPaymentMethod)) {
      this.onPaymentMethodChange(supportedMethods[0]);
    }
  }

  formatCardNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 16);
    const formatted = digits.replace(/(.{4})/g, '$1 ').trim();
    input.value = formatted;
    this.paymentForm.get('cardNumber')?.setValue(formatted, { emitEvent: false });
  }

  verifyUpiId(): void {
    const upiId = this.upiIdValue;
    if (!upiId || this.paymentForm.get('upiId')?.invalid) {
      this.paymentForm.get('upiId')?.markAsTouched();
      this.errorMessage = 'Enter a valid UPI ID before verifying.';
      this.paymentState = 'IDLE';
      return;
    }

    this.paymentState = 'VERIFYING_UPI';
    this.errorMessage = 'Verifying UPI ID...';

    this.paymentService.validateUpiId(upiId).subscribe({
      next: (result) => {
        if (result.valid) {
          this.paymentState = 'UPI_VERIFIED';
          this.errorMessage = result.message || 'UPI ID verified successfully.';
          return;
        }

        this.paymentState = 'IDLE';
        this.errorMessage = result.message || 'UPI ID validation failed.';
      },
      error: () => {
        this.paymentState = 'IDLE';
        this.errorMessage = 'UPI verification could not be completed.';
      }
    });
  }

  submitPayment(): void {
    if (this.selectedPaymentMethod === 'UPI' && this.paymentForm.get('upiId')?.invalid) {
      this.paymentForm.get('upiId')?.markAsTouched();
      this.errorMessage = 'Enter a valid UPI ID before continuing.';
      return;
    }

    if (this.selectedPaymentMethod !== 'UPI' && this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      this.errorMessage = 'Please complete all required payment details.';
      return;
    }

    if (this.isProcessing) {
      return;
    }

    this.isSubmitted = true;
    this.paymentState = this.selectedPaymentMethod === 'UPI' ? 'CREATING_PAYMENT' : 'PROCESSING';
    this.errorMessage = '';

    const payload: PaymentRequest = {
      orderId: 'ORD-10001',
      amount: this.orderSummary.total,
      currency: 'INR',
      paymentMethod: this.selectedPaymentMethod,
      idempotencyKey: `pay-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
      upiId: this.selectedPaymentMethod === 'UPI' ? this.upiIdValue : undefined,
      provider: this.selectedProvider
    };

    this.paymentService.createPayment(payload)
      .pipe(finalize(() => {
        this.paymentState = this.paymentResponse?.status === 'SUCCESS' ? 'SUCCESS' : this.paymentResponse?.status === 'FAILED' ? 'FAILED' : 'IDLE';
      }))
      .subscribe({
        next: (response) => {
          this.paymentResponse = response;
          this.isSubmitted = false;
          if (response.checkoutUrl && response.checkoutFields) {
            this.paymentState = 'AWAITING_PAYMENT';
            this.startHostedCheckout(response);
            return;
          }
          if (response.status === 'SUCCESS') {
            this.paymentState = 'SUCCESS';
            this.paymentForm.reset({ paymentMethod: 'CARD', savePaymentMethod: false });
            this.applyPaymentMethodValidators();
            return;
          }

          this.paymentState = 'FAILED';
          this.errorMessage = response.message || 'We couldn\'t process your payment.';
        },
        error: (error) => {
          this.paymentState = 'FAILED';
          this.isSubmitted = false;
          const message = error?.error?.message || 'A network error occurred while processing the payment.';
          this.errorMessage = message;
        }
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

  resetPaymentState(): void {
    this.paymentState = 'IDLE';
    this.paymentResponse = null;
    this.errorMessage = '';
    this.isSubmitted = false;
    this.paymentForm.reset({ paymentMethod: 'CARD', upiId: 'user@upi', savePaymentMethod: false });
    this.applyPaymentMethodValidators();
  }

  goHome(): void {
    this.router.navigate(['/v1/dashboard']);
  }

  private applyPaymentMethodValidators(): void {
    const method = this.selectedPaymentMethod;

    const setValidators = (controlName: string, validators: any[] | null) => {
      const control = this.paymentForm.get(controlName);
      if (!control) {
        return;
      }
      if (validators) {
        control.setValidators(validators);
      } else {
        control.clearValidators();
      }
      control.updateValueAndValidity();
    };

    setValidators('cardNumber', method === 'CARD' ? [Validators.required, Validators.pattern(/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/)] : null);
    setValidators('expiry', method === 'CARD' ? [Validators.required, this.expiryValidator] : null);
    setValidators('cvv', method === 'CARD' ? [Validators.required, Validators.pattern(/^\d{3,4}$/)] : null);
    setValidators('cardHolderName', method === 'CARD' ? [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-Z\s.'-]+$/)] : null);
    setValidators('upiId', method === 'UPI' ? [Validators.required, Validators.pattern(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/)] : null);
    setValidators('bankName', method === 'NET_BANKING' ? [Validators.required] : null);
    setValidators('accountNumber', method === 'NET_BANKING' ? [Validators.required] : null);
    setValidators('walletType', method === 'WALLET' ? [Validators.required] : null);
    setValidators('walletNumber', method === 'WALLET' ? [Validators.required] : null);

    this.paymentForm.updateValueAndValidity();
  }

  private clearError(): void {
    this.errorMessage = '';
  }

  private expiryValidator(control: { value: string }) {
    if (!control.value) {
      return { required: true };
    }

    const match = /^\s*(0?[1-9]|1[0-2])\s*\/\s*(\d{2}|\d{4})\s*$/.exec(control.value);
    if (!match) {
      return { invalidExpiry: true };
    }

    const month = Number(match[1]);
    const yearText = match[2];
    const year = Number(yearText.length === 2 ? `20${yearText}` : yearText);
    const now = new Date();
    const expiry = new Date(year, month, 0, 23, 59, 59);
    if (month < 1 || month > 12 || expiry < now) {
      return { invalidExpiry: true };
    }

    return null;
  }
}
