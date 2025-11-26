'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Upload, Loader2, X } from 'lucide-react';

interface AvatarUploadProps {
    userId: string;
    currentAvatarUrl?: string | null;
    userInitials: string;
}

export function AvatarUpload({
    userId,
    currentAvatarUrl,
    userInitials,
}: AvatarUploadProps) {
    const router = useRouter();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast({
                title: 'Invalid file type',
                description: 'Please upload an image file',
                variant: 'destructive',
            });
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast({
                title: 'File too large',
                description: 'Please upload an image smaller than 2MB',
                variant: 'destructive',
            });
            return;
        }

        setUploading(true);

        try {
            const supabase = createClient();

            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // Update profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', userId);

            if (updateError) throw updateError;

            // Delete old avatar if exists
            if (currentAvatarUrl) {
                const oldPath = currentAvatarUrl.split('/').slice(-2).join('/');
                await supabase.storage.from('avatars').remove([oldPath]);
            }

            setAvatarUrl(publicUrl);
            toast({
                title: 'Avatar updated',
                description: 'Your avatar has been updated successfully.',
            });

            router.refresh();
        } catch (error: any) {
            toast({
                title: 'Upload failed',
                description: error.message || 'Failed to upload avatar',
                variant: 'destructive',
            });
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemoveAvatar = async () => {
        if (!avatarUrl) return;

        setUploading(true);

        try {
            const supabase = createClient();

            // Delete from storage
            const filePath = avatarUrl.split('/').slice(-2).join('/');
            await supabase.storage.from('avatars').remove([filePath]);

            // Update profile
            const { error } = await supabase
                .from('profiles')
                .update({ avatar_url: null })
                .eq('id', userId);

            if (error) throw error;

            setAvatarUrl(null);
            toast({
                title: 'Avatar removed',
                description: 'Your avatar has been removed.',
            });

            router.refresh();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to remove avatar',
                variant: 'destructive',
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
            </Avatar>

            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                >
                    {uploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Upload className="mr-2 h-4 w-4" />
                    )}
                    Upload
                </Button>

                {avatarUrl && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveAvatar}
                        disabled={uploading}
                    >
                        <X className="mr-2 h-4 w-4" />
                        Remove
                    </Button>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>
        </div>
    );
}
