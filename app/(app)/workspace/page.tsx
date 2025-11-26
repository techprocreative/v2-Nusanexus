import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InviteMemberDialog } from '@/components/workspace/invite-member-dialog';
import { MemberList } from '@/components/workspace/member-list';
import { InvitationList } from '@/components/workspace/invitation-list';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

export default async function WorkspacePage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('current_workspace_id')
        .eq('id', user.id)
        .single();

    if (!profile?.current_workspace_id) {
        redirect('/dashboard');
    }

    const { data: workspace } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', profile.current_workspace_id)
        .single();

    const { data: members } = await supabase
        .from('workspace_members')
        .select('*, profiles(first_name, last_name, avatar_url)')
        .eq('workspace_id', profile.current_workspace_id)
        .order('joined_at', { ascending: true });

    const { data: invitations } = await supabase
        .from('workspace_invitations')
        .select('*')
        .eq('workspace_id', profile.current_workspace_id)
        .order('created_at', { ascending: false });

    const isOwner = workspace?.owner_id === user.id;

    return (
        <div className="container max-w-4xl py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">{workspace?.name}</h1>
                    <p className="text-muted-foreground">
                        Manage your workspace members and settings
                    </p>
                </div>
                {isOwner && (
                    <Button asChild variant="outline">
                        <Link href="/workspace/settings">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                        </Link>
                    </Button>
                )}
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Members</CardTitle>
                                <CardDescription>
                                    {members?.length || 0} member{members?.length !== 1 ? 's' : ''}
                                </CardDescription>
                            </div>
                            {isOwner && <InviteMemberDialog workspaceId={profile.current_workspace_id} />}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <MemberList
                            members={members || []}
                            workspaceId={profile.current_workspace_id}
                            currentUserId={user.id}
                            isOwner={isOwner}
                        />
                    </CardContent>
                </Card>

                {isOwner && invitations && invitations.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Invitations</CardTitle>
                            <CardDescription>
                                {invitations.length} pending invitation{invitations.length !== 1 ? 's' : ''}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <InvitationList
                                invitations={invitations}
                                workspaceId={profile.current_workspace_id}
                            />
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
