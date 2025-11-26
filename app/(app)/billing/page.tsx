import { redirect } from 'next/navigation';

export default function BillingPage() {
  // Legacy Stripe-based billing UI has been replaced.
  // Redirect users to the new billing settings page that uses Tripay/Midtrans.
  redirect('/settings/billing');
}
