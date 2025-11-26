'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, UserCog } from 'lucide-react';

interface Member {
    user_id: string;
    profiles: {
        first_name: string;
        last_name: string;
    };
}

interface TransferOwnershipDialogProps {
    workspaceId: string;
    members: Member[];
}

export function TransferOwnershipDialog({
    workspaceId,
    members,
}: TransferOwnershipDialogProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState('');

    const handleTransfer = async () => {
        if (!selectedUserId) {
            toast({
                title: 'Member required',
                description: 'Please select a member to transfer ownership to',
                variant: 'destructive',
            });
            return;
        }

        if (!confirm('Are you sure you want to transfer ownership? This action cannot be undone.')) {
            return;
        }

        setLoading(true);

        try {
            const supabase = createClient();

            // Update workspace owner
            const { error: workspaceError } = await supabase
                .from('workspaces')
                .update({ owner_id: selectedUserId })
                .eq('id', workspaceId);

            if (workspaceError) throw workspaceError;

            // Update roles
            const { error: roleError } = await supabase
                .from('workspace_members')
                .update({ role: 'owner' })
                .eq('workspace_id', workspaceId)
                .eq('user_id', selectedUserId);

            if (roleError) throw roleError;

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase
                    .from('workspace_members')
                    .update({ role: 'admin' })
                    .eq('workspace_id', workspaceId)
                    .eq('user_id', user.id);
            }

            // Log activity
            await supabase.rpc('log_activity', {
                p_workspace_id: workspaceId,
                p_action: 'transferred_ownership',
                p_metadata: { new_owner_id: selectedUserId },
            });

            toast({
                title: 'Ownership transferred',
                description: 'The workspace ownership has been transferred successfully.',
            });

            setOpen(false);
            router.refresh();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to transfer ownership',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <UserCog className="mr-2 h-4 w-4" />
                    Transfer Ownership
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Transfer Ownership</DialogTitle>
                    <DialogDescription>
                        Transfer workspace ownership to another member. You will become an admin.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="space-y-2">
                        <Label htmlFor="member">Select New Owner</Label>
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                            <SelectTrigger id="member">
                                <SelectValue placeholder="Select a member" />
                            </SelectTrigger>
                            <SelectContent>
                                {members.map((member) => (
                                    <SelectItem key={member.user_id} value={member.user_id}>
                                        {member.profiles.first_name} {member.profiles.last_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleTransfer} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Transfer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
