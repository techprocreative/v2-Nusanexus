'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Volume2, Download } from 'lucide-react';

const VOICES = [
    { value: 'alloy', label: 'Alloy' },
    { value: 'echo', label: 'Echo' },
    { value: 'fable', label: 'Fable' },
    { value: 'onyx', label: 'Onyx' },
    { value: 'nova', label: 'Nova' },
    { value: 'shimmer', label: 'Shimmer' },
];

export default function VoicePage() {
    const searchParams = useSearchParams();
    const presetId = searchParams.get('preset');
    const { toast } = useToast();

    const [text, setText] = useState('');
    const [voice, setVoice] = useState('alloy');
    const [speed, setSpeed] = useState(1.0);
    const [loading, setLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [preset, setPreset] = useState<any>(null);

    useEffect(() => {
        if (presetId) {
            fetchPreset(presetId);
        }
    }, [presetId]);

    const fetchPreset = async (id: string) => {
        try {
            const response = await fetch(`/api/presets/${id}`);
            const data = await response.json();

            if (response.ok && data.preset) {
                setPreset(data.preset);
                if (data.preset.template) {
                    setText(data.preset.template);
                }
            }
        } catch (error) {
            console.error('Error fetching preset:', error);
        }
    };

    const handleGenerate = async () => {
        if (!text.trim()) {
            toast({
                title: 'Error',
                description: 'Please enter text to convert',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        setAudioUrl(null);

        try {
            const response = await fetch('/api/ai/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    voice,
                    speed,
                    presetId: presetId || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate speech');
            }

            if (data.audioUrl) {
                setAudioUrl(data.audioUrl);
                toast({
                    title: 'Success!',
                    description: `Speech generated using ${data.usage?.credits || 0} credits`,
                });
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!audioUrl) return;
        const a = document.createElement('a');
        a.href = audioUrl;
        a.download = `speech-${Date.now()}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Text to Speech</h1>
                <p className="text-muted-foreground">
                    Convert text to natural-sounding speech
                </p>
                {preset && (
                    <div className="mt-3 flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Using preset:</span>
                        <span className="text-sm font-medium">{preset.title}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Input</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="text">Text</Label>
                                <Textarea
                                    id="text"
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Enter text to convert to speech..."
                                    className="min-h-[200px]"
                                />
                                <p className="text-xs text-muted-foreground">
                                    {text.length} characters
                                </p>
                            </div>

                            <Button
                                onClick={handleGenerate}
                                disabled={loading || !text.trim()}
                                className="w-full"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Volume2 className="mr-2 h-4 w-4" />
                                        Generate Speech
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {(audioUrl || loading) && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Generated Audio</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : audioUrl ? (
                                    <div className="space-y-4">
                                        <audio controls className="w-full">
                                            <source src={audioUrl} type="audio/mpeg" />
                                        </audio>
                                        <Button onClick={handleDownload} variant="outline" className="w-full">
                                            <Download className="mr-2 h-4 w-4" />
                                            Download Audio
                                        </Button>
                                    </div>
                                ) : null}
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="voice">Voice</Label>
                                <Select value={voice} onValueChange={setVoice}>
                                    <SelectTrigger id="voice">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {VOICES.map((v) => (
                                            <SelectItem key={v.value} value={v.value}>
                                                {v.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="speed">Speed</Label>
                                    <span className="text-sm text-muted-foreground">{speed.toFixed(1)}x</span>
                                </div>
                                <Slider
                                    id="speed"
                                    min={0.25}
                                    max={4}
                                    step={0.25}
                                    value={[speed]}
                                    onValueChange={(values) => setSpeed(values[0])}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Credit Cost</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            <p>1 credit per 1000 characters</p>
                            <p className="mt-2">Current text: ~{Math.ceil(text.length / 1000)} credits</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
