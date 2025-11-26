'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [newEmail, setNewEmail] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newEmail === currentEmail) {
            toast({
                title: 'Same email',
                description: 'Please enter a different email address.',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);

        try {
            const supabase = createClient();

            const { error } = await supabase.auth.updateUser({
                email: newEmail,
            });

            if (error) throw error;

            toast({
                title: 'Verification email sent',
                description: 'Please check your new email address to confirm the change.',
            });

            setNewEmail('');
            router.refresh();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update email',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="currentEmail">Current Email</Label>
                <Input
                    id="currentEmail"
                    type="email"
                    value={currentEmail}
                    disabled
                    className="bg-muted"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="newEmail">New Email</Label>
                <Input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="new@example.com"
                    required
                />
                <p className="text-sm text-muted-foreground">
                    You will receive a verification email at the new address
                </p>
            </div>

            <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Email
            </Button>
        </form>
    );
}
