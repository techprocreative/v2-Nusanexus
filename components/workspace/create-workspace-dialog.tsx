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
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface CreateWorkspaceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateWorkspaceDialog({
    open,
    onOpenChange,
}: CreateWorkspaceDialogProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast({
                title: 'Name required',
                description: 'Please enter a workspace name',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('workspaces')
                .insert({
                    name: name.trim(),
                    owner_id: user.id,
                })
                .select()
                .single();

            if (error) throw error;

            // Log activity
            await supabase.rpc('log_activity', {
                p_workspace_id: data.id,
                p_action: 'created_workspace',
                p_metadata: { workspace_name: name.trim() },
            });

            toast({
                title: 'Workspace created',
                description: `${name} has been created successfully.`,
            });

            setName('');
            onOpenChange(false);
            router.refresh();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to create workspace',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create Workspace</DialogTitle>
                        <DialogDescription>
                            Create a new workspace to organize your AI content generation.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Workspace Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="My Workspace"
                                required
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
