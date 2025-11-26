'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { X } from 'lucide-react';

interface Invitation {
    id: string;
    email: string;
    created_at: string;
}

interface InvitationListProps {
    invitations: Invitation[];
    workspaceId: string;
}

export function InvitationList({
    invitations,
    workspaceId,
}: InvitationListProps) {
    const router = useRouter();
    const { toast } = useToast();

    const handleCancelInvitation = async (invitationId: string) => {
        try {
            const supabase = createClient();

            const { error } = await supabase
                .from('workspace_invitations')
                .delete()
                .eq('id', invitationId);

            if (error) throw error;

            toast({
                title: 'Invitation cancelled',
                description: 'The invitation has been cancelled.',
            });

            router.refresh();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to cancel invitation',
                variant: 'destructive',
            });
        }
    };

    if (invitations.length === 0) {
        return (
            <p className="text-sm text-muted-foreground text-center py-8">
                No pending invitations
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {invitations.map((invitation) => (
                <div
                    key={invitation.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                >
                    <div>
                        <p className="font-medium">{invitation.email}</p>
                        <p className="text-sm text-muted-foreground">
                            Sent {new Date(invitation.created_at).toLocaleDateString()}
                        </p>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelInvitation(invitation.id)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ))}
        </div>
    );
}
