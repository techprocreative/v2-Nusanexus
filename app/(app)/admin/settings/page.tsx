'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save } from 'lucide-react';

export default function AdminSettingsPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        site_name: '',
        site_logo: '',
        smtp_host: '',
        smtp_port: '',
        smtp_user: '',
        smtp_password: '',
        maintenance_mode: false,
        feature_ai_writer: true,
        feature_image_gen: true,
        feature_code_gen: true,
        feature_chat: true,
        feature_voice: true,
        feature_transcription: true,
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/admin/settings');
            const data = await response.json();

            if (response.ok) {
                setSettings({ ...settings, ...data.settings });
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings }),
            });

            if (response.ok) {
                toast({
                    title: 'Success',
                    description: 'Settings saved successfully',
                });
            } else {
                throw new Error('Failed to save settings');
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to save settings',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-12 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">System Settings</h1>
                    <p className="text-muted-foreground">Configure system-wide settings</p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Site Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Site Settings</CardTitle>
                        <CardDescription>Basic site configuration</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="site_name">Site Name</Label>
                            <Input
                                id="site_name"
                                value={settings.site_name}
                                onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                                placeholder="Aikeedo"
                            />
                        </div>
                        <div>
                            <Label htmlFor="site_logo">Site Logo URL</Label>
                            <Input
                                id="site_logo"
                                value={settings.site_logo}
                                onChange={(e) => setSettings({ ...settings, site_logo: e.target.value })}
                                placeholder="https://example.com/logo.png"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* SMTP Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>SMTP Settings</CardTitle>
                        <CardDescription>Email server configuration</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="smtp_host">SMTP Host</Label>
                            <Input
                                id="smtp_host"
                                value={settings.smtp_host}
                                onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                                placeholder="smtp.gmail.com"
                            />
                        </div>
                        <div>
                            <Label htmlFor="smtp_port">SMTP Port</Label>
                            <Input
                                id="smtp_port"
                                value={settings.smtp_port}
                                onChange={(e) => setSettings({ ...settings, smtp_port: e.target.value })}
                                placeholder="587"
                            />
                        </div>
                        <div>
                            <Label htmlFor="smtp_user">SMTP Username</Label>
                            <Input
                                id="smtp_user"
                                value={settings.smtp_user}
                                onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                                placeholder="your-email@gmail.com"
                            />
                        </div>
                        <div>
                            <Label htmlFor="smtp_password">SMTP Password</Label>
                            <Input
                                id="smtp_password"
                                type="password"
                                value={settings.smtp_password}
                                onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value })}
                                placeholder="••••••••"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Feature Flags */}
                <Card>
                    <CardHeader>
                        <CardTitle>Feature Flags</CardTitle>
                        <CardDescription>Enable or disable features</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="feature_ai_writer">AI Writer</Label>
                            <Switch
                                id="feature_ai_writer"
                                checked={settings.feature_ai_writer}
                                onCheckedChange={(checked) => setSettings({ ...settings, feature_ai_writer: checked })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="feature_image_gen">Image Generator</Label>
                            <Switch
                                id="feature_image_gen"
                                checked={settings.feature_image_gen}
                                onCheckedChange={(checked) => setSettings({ ...settings, feature_image_gen: checked })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="feature_code_gen">Code Generator</Label>
                            <Switch
                                id="feature_code_gen"
                                checked={settings.feature_code_gen}
                                onCheckedChange={(checked) => setSettings({ ...settings, feature_code_gen: checked })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="feature_chat">Chat/Conversation</Label>
                            <Switch
                                id="feature_chat"
                                checked={settings.feature_chat}
                                onCheckedChange={(checked) => setSettings({ ...settings, feature_chat: checked })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="feature_voice">Voice/TTS</Label>
                            <Switch
                                id="feature_voice"
                                checked={settings.feature_voice}
                                onCheckedChange={(checked) => setSettings({ ...settings, feature_voice: checked })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="feature_transcription">Transcription</Label>
                            <Switch
                                id="feature_transcription"
                                checked={settings.feature_transcription}
                                onCheckedChange={(checked) => setSettings({ ...settings, feature_transcription: checked })}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* System Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>System Settings</CardTitle>
                        <CardDescription>System-wide configuration</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="maintenance_mode">Maintenance Mode</Label>
                                <p className="text-sm text-muted-foreground">Disable site access for maintenance</p>
                            </div>
                            <Switch
                                id="maintenance_mode"
                                checked={settings.maintenance_mode}
                                onCheckedChange={(checked) => setSettings({ ...settings, maintenance_mode: checked })}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
