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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react';

interface DeleteWorkspaceDialogProps {
    workspaceId: string;
    workspaceName: string;
}

export function DeleteWorkspaceDialog({
    workspaceId,
    workspaceName,
}: DeleteWorkspaceDialogProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [confirmName, setConfirmName] = useState('');

    const handleDelete = async () => {
        if (confirmName !== workspaceName) {
            toast({
                title: 'Name mismatch',
                description: 'Please type the workspace name exactly to confirm',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);

        try {
            const supabase = createClient();

            const { error } = await supabase
                .from('workspaces')
                .delete()
                .eq('id', workspaceId);

            if (error) throw error;

            toast({
                title: 'Workspace deleted',
                description: 'The workspace has been permanently deleted.',
            });

            router.push('/dashboard');
            router.refresh();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete workspace',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive">Delete Workspace</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <DialogTitle>Delete Workspace</DialogTitle>
                    </div>
                    <DialogDescription>
                        This action cannot be undone. This will permanently delete the
                        workspace and all associated data including library items, conversations,
                        and activity logs.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="space-y-2">
                        <Label htmlFor="confirmName">
                            Type <strong>{workspaceName}</strong> to confirm
                        </Label>
                        <Input
                            id="confirmName"
                            value={confirmName}
                            onChange={(e) => setConfirmName(e.target.value)}
                            placeholder={workspaceName}
                        />
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
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={loading}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete Workspace
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
