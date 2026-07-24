export type PaymentStatus = 'pending' | 'verified' | 'rejected';

export interface PaymentDTO {
  id: string;
  appointmentId: string;
  status: PaymentStatus;
  screenshotUrl: string | null;
  transactionReference: string | null;
  remarks: string | null;
  verifiedById: string | null;
  verifiedByName: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

export interface PaymentSettingsDTO {
  clinicName: string;
  upiId: string;
  qrImageUrl: string | null;
  paymentInstructions: string | null;
}

export interface RazorpayOrderDTO {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  clinicName: string;
  description: string;
  prefill: {
    name: string;
    email: string;
    phone: string;
  };
}

