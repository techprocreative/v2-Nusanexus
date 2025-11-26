import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { ProfileForm } from '@/components/auth/profile-form';
import { AvatarUpload } from '@/components/auth/avatar-upload';
import { ChangePasswordForm } from '@/components/auth/change-password-form';
import { ChangeEmailForm } from '@/components/auth/change-email-form';
import { DeleteAccountDialog } from '@/components/auth/delete-account-dialog';

export default async function ProfilePage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!profile) {
        redirect('/login');
    }

    const userInitials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() || 'U';

    return (
        <div className="container max-w-4xl py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Profile Settings</h1>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences
                </p>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="danger">Danger Zone</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>
                                Update your personal information
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ProfileForm profile={profile} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Avatar</CardTitle>
                            <CardDescription>
                                Upload a profile picture
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AvatarUpload
                                userId={user.id}
                                currentAvatarUrl={profile.avatar_url}
                                userInitials={userInitials}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Change Password</CardTitle>
                            <CardDescription>
                                Update your password to keep your account secure
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChangePasswordForm />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Change Email</CardTitle>
                            <CardDescription>
                                Update your email address
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChangeEmailForm currentEmail={user.email || ''} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="danger">
                    <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle className="text-destructive">Delete Account</CardTitle>
                            <CardDescription>
                                Permanently delete your account and all associated data. This
                                action cannot be undone.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DeleteAccountDialog />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
