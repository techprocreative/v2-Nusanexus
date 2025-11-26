import { createClient } from '@/lib/supabase/server';

export default async function BillingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('current_workspace_id')
    .eq('id', user?.id)
    .single();

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, plans(*)')
    .eq('workspace_id', profile?.current_workspace_id ?? '')
    .eq('status', 'active')
    .single();

  const { data: plans } = await supabase
    .from('plans')
    .select('*')
    .eq('status', 1)
    .order('superiority', { ascending: true });

  const { data: orders } = await supabase
    .from('orders')
    .select('*, plan_snapshots(*)')
    .eq('workspace_id', profile?.current_workspace_id ?? '')
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-gray-600">Manage your subscription and billing</p>
      </div>

      {subscription ? (
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Current Plan</h2>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
              Active
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-bold">
              {subscription.plans?.title}
            </span>
            <span className="text-gray-600">
              ${((subscription.plans?.price ?? 0) / 100).toFixed(2)}/
              {subscription.plans?.billing_cycle}
            </span>
          </div>
          {subscription.renew_at && (
            <p className="text-sm text-gray-600">
              Next billing date:{' '}
              {new Date(subscription.renew_at).toLocaleDateString()}
            </p>
          )}
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-2">No Active Subscription</h2>
          <p className="text-gray-600">
            Choose a plan below to get started with Aikeedo.
          </p>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans?.map((plan) => (
            <div
              key={plan.id}
              className={`p-6 bg-white rounded-xl border ${
                plan.is_featured ? 'border-primary ring-2 ring-primary' : ''
              }`}
            >
              {plan.is_featured && (
                <span className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded mb-2 inline-block">
                  Popular
                </span>
              )}
              <h3 className="text-xl font-bold">{plan.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
              <div className="mb-4">
                <span className="text-3xl font-bold">
                  ${(plan.price / 100).toFixed(2)}
                </span>
                <span className="text-gray-600">/{plan.billing_cycle}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.feature_list?.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">✓</span>
                    {feature}
                  </li>
                ))}
                {plan.credit_count && (
                  <li className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">✓</span>
                    {plan.credit_count.toLocaleString()} credits
                  </li>
                )}
              </ul>
              <button className="w-full py-2 border rounded-lg hover:bg-gray-50">
                {subscription?.plan_id === plan.id
                  ? 'Current Plan'
                  : 'Select Plan'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Order History</h2>
        {orders && orders.length > 0 ? (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Plan
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3 text-sm">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {order.plan_snapshots?.title}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      ${(order.total_amount / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          order.is_paid
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {order.is_paid ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">No orders yet.</p>
        )}
      </div>
    </div>
  );
}
