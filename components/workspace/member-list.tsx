'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { UserX } from 'lucide-react';

interface Member {
    user_id: string;
    role: string;
    joined_at: string;
    profiles: {
        first_name: string;
        last_name: string;
        avatar_url: string | null;
    };
}

interface MemberListProps {
    members: Member[];
    workspaceId: string;
    currentUserId: string;
    isOwner: boolean;
}

export function MemberList({
    members,
    workspaceId,
    currentUserId,
    isOwner,
}: MemberListProps) {
    const router = useRouter();
    const { toast } = useToast();

    const handleRemoveMember = async (userId: string) => {
        if (!confirm('Are you sure you want to remove this member?')) {
            return;
        }

        try {
            const supabase = createClient();

            const { error } = await supabase
                .from('workspace_members')
                .delete()
                .eq('workspace_id', workspaceId)
                .eq('user_id', userId);

            if (error) throw error;

            // Log activity
            await supabase.rpc('log_activity', {
                p_workspace_id: workspaceId,
                p_action: 'removed_member',
                p_metadata: { user_id: userId },
            });

            toast({
                title: 'Member removed',
                description: 'The member has been removed from the workspace.',
            });

            router.refresh();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to remove member',
                variant: 'destructive',
            });
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'owner':
                return 'bg-purple-100 text-purple-800';
            case 'admin':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-4">
            {members.map((member) => (
                <div
                    key={member.user_id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                >
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            {member.profiles.avatar_url ? (
                                <img
                                    src={member.profiles.avatar_url}
                                    alt="Avatar"
                                    className="h-10 w-10 rounded-full"
                                />
                            ) : (
                                <span className="text-sm font-medium">
                                    {member.profiles.first_name?.[0]}
                                    {member.profiles.last_name?.[0]}
                                </span>
                            )}
                        </div>
                        <div>
                            <p className="font-medium">
                                {member.profiles.first_name} {member.profiles.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Joined {new Date(member.joined_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(
                                member.role
                            )}`}
                        >
                            {member.role}
                        </span>

                        {isOwner && member.user_id !== currentUserId && member.role !== 'owner' && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMember(member.user_id)}
                            >
                                <UserX className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
