import { redirect } from 'next/navigation';

export default function BillingPage() {
  // Legacy /billing route - redirect to the new billing settings page
  redirect('/settings/billing');
}
