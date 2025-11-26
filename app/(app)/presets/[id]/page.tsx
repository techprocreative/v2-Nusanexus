'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, FileText, Code, Image, Mic, FileAudio, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

interface Preset {
    id: string;
    title: string;
    description: string;
    type: string;
    template?: string;
    image?: string;
    color?: string;
    category?: {
        id: string;
        title: string;
    };
}

const typeIcons: Record<string, any> = {
    writer: FileText,
    coder: Code,
    image: Image,
    voiceover: Mic,
    transcription: FileAudio,
};

const typeRoutes: Record<string, string> = {
    writer: '/writer',
    coder: '/code',
    image: '/image',
    voiceover: '/voice',
    transcription: '/transcription',
};

export default function PresetDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { toast } = useToast();
    const [preset, setPreset] = useState<Preset | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPreset();
    }, [params.id]);

    const fetchPreset = async () => {
        try {
            const response = await fetch(`/api/presets/${params.id}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch preset');
            }

            setPreset(data.preset);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
            router.push('/presets');
        } finally {
            setLoading(false);
        }
    };

    const handleUsePreset = () => {
        if (!preset) return;

        const route = typeRoutes[preset.type] || '/writer';
        router.push(`${route}?preset=${preset.id}`);
    };

    if (loading) {
        return (
            <div className="container mx-auto py-8">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    if (!preset) {
        return null;
    }

    const Icon = typeIcons[preset.type] || Sparkles;

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <Button variant="ghost" asChild className="mb-6">
                <Link href="/presets">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Presets
                </Link>
            </Button>

            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`${preset.color || 'bg-primary'} p-4 rounded-lg text-white`}>
                                <Icon className="h-8 w-8" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl mb-2">{preset.title}</CardTitle>
                                <div className="flex gap-2">
                                    {preset.category && (
                                        <Badge variant="secondary">{preset.category.title}</Badge>
                                    )}
                                    <Badge variant="outline" className="capitalize">
                                        {preset.type}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="font-semibold mb-2">Description</h3>
                        <p className="text-muted-foreground">{preset.description}</p>
                    </div>

                    {preset.template && (
                        <div>
                            <h3 className="font-semibold mb-2">Template</h3>
                            <div className="bg-muted p-4 rounded-lg">
                                <pre className="text-sm whitespace-pre-wrap">{preset.template}</pre>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Variables in the template (e.g., {`{{variable}}`}) will be replaced with your input
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button onClick={handleUsePreset} size="lg" className="flex-1">
                            Use This Preset
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
