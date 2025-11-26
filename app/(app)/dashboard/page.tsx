import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { CreditUsageChart } from '@/components/dashboard/credit-usage-chart';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { WorkspaceStats } from '@/components/dashboard/workspace-stats';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, workspaces!current_workspace_id(*)')
    .eq('id', user?.id)
    .single();

  const workspace = profile?.workspaces;

  // Get recent items
  const { data: recentItems } = await supabase
    .from('library_items')
    .select('*')
    .eq('workspace_id', workspace?.id ?? '')
    .order('created_at', { ascending: false })
    .limit(5);

  // Get workspace stats
  const { count: totalItems } = await supabase
    .from('library_items')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspace?.id ?? '');

  const { count: memberCount } = await supabase
    .from('workspace_members')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspace?.id ?? '');

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: itemsThisMonth } = await supabase
    .from('library_items')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspace?.id ?? '')
    .gte('created_at', startOfMonth.toISOString());

  // Get recent activities
  const { data: activities } = await supabase
    .from('activity_log')
    .select('*, profiles(first_name, last_name)')
    .eq('workspace_id', workspace?.id ?? '')
    .order('created_at', { ascending: false })
    .limit(10);

  // Generate mock credit usage data for last 30 days
  const creditUsageData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toISOString(),
      credits: Math.floor(Math.random() * 500) + 100,
    };
  });

  const stats = {
    totalItems: totalItems || 0,
    creditsUsedThisMonth: workspace?.credit_count
      ? Math.max(0, 10000 - workspace.credit_count)
      : 0,
    memberCount: memberCount || 0,
    itemsThisMonth: itemsThisMonth || 0,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {profile?.first_name}!
          </h1>
          <p className="text-gray-600">
            What would you like to create today?
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Credits remaining</p>
          <p className="text-2xl font-bold">
            {workspace?.credit_count?.toLocaleString() ?? 0}
          </p>
        </div>
      </div>

      <WorkspaceStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CreditUsageChart data={creditUsageData} />
        <ActivityFeed activities={activities || []} />
      </div>

      <QuickActions />

      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Generations</h2>
          <Link href="/library" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        {recentItems && recentItems.length > 0 ? (
          <div className="space-y-3">
            {recentItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {item.title || `${item.type} generation`}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 bg-gray-200 rounded">
                  {item.type}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">
            No generations yet. Start creating!
          </p>
        )}
      </div>
    </div>
  );
}
