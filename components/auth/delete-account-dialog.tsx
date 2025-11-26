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

export function DeleteAccountDialog() {
    const router = useRouter();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmText, setConfirmText] = useState('');

    const handleDelete = async () => {
        if (confirmText !== 'DELETE') {
            toast({
                title: 'Confirmation required',
                description: 'Please type DELETE to confirm',
                variant: 'destructive',
            });
            return;
        }

        if (!password) {
            toast({
                title: 'Password required',
                description: 'Please enter your password to confirm',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user?.email) throw new Error('Not authenticated');

            // Verify password
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password,
            });

            if (signInError) {
                throw new Error('Incorrect password');
            }

            // Delete user account (this will cascade delete profile and related data)
            const { error } = await supabase.rpc('delete_user_account');

            if (error) throw error;

            toast({
                title: 'Account deleted',
                description: 'Your account has been permanently deleted.',
            });

            // Sign out and redirect
            await supabase.auth.signOut();
            router.push('/');
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete account',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive">Delete Account</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <DialogTitle>Delete Account</DialogTitle>
                    </div>
                    <DialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove all your data from our servers.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="confirmText">
                            Type <strong>DELETE</strong> to confirm
                        </Label>
                        <Input
                            id="confirmText"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="DELETE"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Enter your password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
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
                        Delete Account
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
