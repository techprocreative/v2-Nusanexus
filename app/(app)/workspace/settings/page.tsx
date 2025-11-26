import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { TransferOwnershipDialog } from '@/components/workspace/transfer-ownership-dialog';
import { DeleteWorkspaceDialog } from '@/components/workspace/delete-workspace-dialog';

export default async function WorkspaceSettingsPage() {
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

    if (workspace?.owner_id !== user.id) {
        redirect('/workspace');
    }

    const { data: members } = await supabase
        .from('workspace_members')
        .select('user_id, profiles(first_name, last_name)')
        .eq('workspace_id', profile.current_workspace_id)
        .neq('user_id', user.id);

    return (
        <div className="container max-w-4xl py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Workspace Settings</h1>
                <p className="text-muted-foreground">
                    Manage your workspace settings and ownership
                </p>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Workspace Name</CardTitle>
                        <CardDescription>
                            The name of your workspace
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                defaultValue={workspace?.name}
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-sm text-muted-foreground">
                                Contact support to rename your workspace
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {members && members.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Transfer Ownership</CardTitle>
                            <CardDescription>
                                Transfer workspace ownership to another member
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TransferOwnershipDialog
                                workspaceId={profile.current_workspace_id}
                                members={members}
                            />
                        </CardContent>
                    </Card>
                )}

                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive">Danger Zone</CardTitle>
                        <CardDescription>
                            Permanently delete this workspace and all associated data
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DeleteWorkspaceDialog
                            workspaceId={profile.current_workspace_id}
                            workspaceName={workspace?.name || ''}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
