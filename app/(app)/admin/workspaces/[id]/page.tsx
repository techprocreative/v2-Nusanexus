'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function AdminWorkspaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [workspace, setWorkspace] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creditAdjustment, setCreditAdjustment] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchWorkspaceDetails();
  }, [params.id]);

  const fetchWorkspaceDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/workspaces/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setWorkspace(data.workspace);
        setMembers(data.members || []);
        setSubscriptions(data.subscriptions || []);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch workspace details',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch workspace details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreditAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditAdjustment) return;

    setProcessing(true);
    try {
      const amount = parseInt(creditAdjustment);
      const response = await fetch(`/api/admin/workspaces/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creditAdjustment: amount }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to adjust credits');
      }

      toast({
        title: 'Success',
        description: `Credits ${amount > 0 ? 'added' : 'deducted'}`,
      });
      setCreditAdjustment('');
      fetchWorkspaceDetails();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to adjust credits',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!workspace) {
    return <div className="container mx-auto py-12">Workspace not found</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Workspaces
      </Button>

      <h1 className="text-3xl font-bold mb-6">Workspace Details</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workspace Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">{workspace.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Owner</Label>
                  <p className="font-medium">
                    {workspace.owner_profile
                      ? `${workspace.owner_profile.first_name ?? ''} ${
                          workspace.owner_profile.last_name ?? ''
                        }`.trim() || workspace.owner_profile.id
                      : 'Unknown'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Credits</Label>
                  <p className="font-medium">{(workspace.credit_count ?? 0).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div>
                    <Badge variant={workspace.is_active ? 'default' : 'secondary'}>
                      {workspace.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="font-medium">
                    {new Date(workspace.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Updated</Label>
                  <p className="font-medium">
                    {workspace.updated_at
                      ? new Date(workspace.updated_at).toLocaleDateString()
                      : '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>Users who have access to this workspace</CardDescription>
            </CardHeader>
            <CardContent>
              {members.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {`${member.profile.first_name ?? ''} ${
                                member.profile.last_name ?? ''
                              }`.trim() || member.profile.id}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {member.profile.id}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{member.role}</Badge>
                        </TableCell>
                        <TableCell>
                          {member.created_at
                            ? new Date(member.created_at).toLocaleDateString()
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-6">No members</p>
              )}
            </CardContent>
          </Card>

          {/* Subscriptions */}
          <Card>
            <CardHeader>
              <CardTitle>Subscriptions</CardTitle>
              <CardDescription>Subscription history for this workspace</CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptions.length > 0 ? (
                <div className="space-y-3">
                  {subscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div>
                        <p className="font-medium">{sub.plans?.title || 'Unknown plan'}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {sub.status} •{` `}
                          {sub.current_period_end
                            ? `until ${new Date(sub.current_period_end).toLocaleDateString()}`
                            : 'no period end'}
                        </p>
                      </div>
                      <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                        {sub.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-6">No subscriptions</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Credit Adjustment</CardTitle>
              <CardDescription>Add or remove credits</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreditAdjustment} className="space-y-3">
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount (+ or -)"
                    value={creditAdjustment}
                    onChange={(e) => setCreditAdjustment(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use positive for adding, negative for removing
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={processing || !creditAdjustment}>
                  {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Adjust Credits
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Owner</CardTitle>
              <CardDescription>View owner user profile</CardDescription>
            </CardHeader>
            <CardContent>
              {workspace.owner_profile ? (
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/admin/users/${workspace.owner_profile.id}`}>Open Owner Profile</Link>
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">No owner profile found</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}