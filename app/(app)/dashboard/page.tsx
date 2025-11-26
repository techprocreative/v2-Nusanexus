import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { CreditUsageChart } from '@/components/dashboard/credit-usage-chart';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { WorkspaceStats } from '@/components/dashboard/workspace-stats';

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  // Load recent activities
  const { data: activities } = await supabase
    .from('activity_log')
    .select('*, profiles(first_name, last_name)')
    .eq('workspace_id', workspace?.id ?? '')
    .order('created_at', { ascending: false })
    .limit(10);

  // Load real credit usage stats for last 30 days
  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0);

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 29);

  const { data: usageRows } = await supabase
    .from('stats')
    .select('date, metric')
    .eq('workspace_id', workspace?.id ?? '')
    .eq('type', 'usage')
    .gte('date', startDate.toISOString().slice(0, 10))
    .lte('date', endDate.toISOString().slice(0, 10))
    .order('date', { ascending: true });

  const usageMap = new Map<string, number>();
  (usageRows || []).forEach((row: any) => {
    const key = row.date;
    const value = Number(row.metric) || 0;
    usageMap.set(key, (usageMap.get(key) || 0) + value);
  });

  const creditUsageData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    return {
      date: d.toISOString(),
      credits: usageMap.get(key) || 0,
    };
  });

  const totalCreditsUsed = creditUsageData.reduce(
    (sum, item) => sum + item.credits,
    0
  );

  const stats = {
    totalItems: totalItems || 0,
    creditsUsedThisMonth: totalCreditsUsed,
    memberCount: memberCount || 0,
    itemsThisMonth: itemsThisMonth || 0,
  };

  const creditsRemaining = workspace?.credit_count ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {profile?.first_name}!
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your usage and jump back into creating with AI.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Credits Remaining
            </p>
            <p className="text-3xl font-semibold">
              {creditsRemaining.toLocaleString()}
            </p>
          </div>
          <Link
            href="/pricing"
            className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
          >
            Top Up Credits
          </Link>
        </div>
      </div>

      <WorkspaceStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CreditUsageChart data={creditUsageData} />
        <ActivityFeed activities={activities || []} />
      </div>

      <QuickActions />

      <div className="bg-card rounded-xl border p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-lg font-semibold">Recent Generations</h2>
          <Link
            href="/library"
            className="text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        {recentItems && recentItems.length > 0 ? (
          <div className="space-y-3">
            {recentItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/40"
              >
                <div>
                  <p className="font-medium text-sm">
                    {item.title || `${item.type} generation`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-background border text-muted-foreground capitalize">
                  {item.type}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8 text-sm">
            No generations yet. Start creating your first content from the
            Quick Actions above.
          </p>
        )}
      </div>
    </div>
  );
}
