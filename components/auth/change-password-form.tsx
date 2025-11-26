'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export function ChangePasswordForm() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            toast({
                title: 'Passwords do not match',
                description: 'Please make sure your passwords match.',
                variant: 'destructive',
            });
            return;
        }

        if (formData.newPassword.length < 8) {
            toast({
                title: 'Password too short',
                description: 'Password must be at least 8 characters long.',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);

        try {
            const supabase = createClient();

            // Verify current password by attempting to sign in
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.email) throw new Error('Not authenticated');

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: formData.currentPassword,
            });

            if (signInError) {
                throw new Error('Current password is incorrect');
            }

            // Update password
            const { error } = await supabase.auth.updateUser({
                password: formData.newPassword,
            });

            if (error) throw error;

            toast({
                title: 'Password updated',
                description: 'Your password has been changed successfully.',
            });

            setFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });

            router.refresh();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update password',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                    id="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) =>
                        setFormData({ ...formData, currentPassword: e.target.value })
                    }
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                    id="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) =>
                        setFormData({ ...formData, newPassword: e.target.value })
                    }
                    required
                    minLength={8}
                />
                <p className="text-sm text-muted-foreground">
                    Must be at least 8 characters long
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                        setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    required
                />
            </div>

            <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change Password
            </Button>
        </form>
    );
}
