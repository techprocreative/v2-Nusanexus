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
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Download, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

export default function ImageGeneratorPage() {
    const searchParams = useSearchParams();
    const presetId = searchParams.get('preset');
    const { toast } = useToast();

    const [prompt, setPrompt] = useState('');
    const [size, setSize] = useState('1024x1024');
    const [quality, setQuality] = useState('standard');
    const [loading, setLoading] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
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
                    setPrompt(data.preset.template);
                }
            }
        } catch (error) {
            console.error('Error fetching preset:', error);
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            toast({
                title: 'Error',
                description: 'Please enter a prompt',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        setGeneratedImage(null);

        try {
            const response = await fetch('/api/ai/image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    size,
                    quality,
                    presetId: presetId || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate image');
            }

            if (data.imageUrl) {
                setGeneratedImage(data.imageUrl);
                toast({
                    title: 'Success!',
                    description: `Image generated using ${data.usage?.credits || 0} credits`,
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

    const handleDownload = async () => {
        if (!generatedImage) return;

        try {
            const response = await fetch(generatedImage);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `generated-image-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({
                title: 'Downloaded!',
                description: 'Image saved to your device',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to download image',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">AI Image Generator</h1>
                <p className="text-muted-foreground">
                    Create stunning images using DALL-E 3
                </p>
                {preset && (
                    <div className="mt-3 flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Using preset:</span>
                        <span className="text-sm font-medium">{preset.title}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Generated Image</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center aspect-square bg-muted rounded-lg">
                                    <div className="text-center">
                                        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                                        <p className="text-muted-foreground">Generating image...</p>
                                    </div>
                                </div>
                            ) : generatedImage ? (
                                <div className="space-y-4">
                                    <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                                        <Image
                                            src={generatedImage}
                                            alt="Generated image"
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                    <Button onClick={handleDownload} className="w-full">
                                        <Download className="mr-2 h-4 w-4" />
                                        Download Image
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center aspect-square bg-muted rounded-lg">
                                    <div className="text-center text-muted-foreground">
                                        <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p>Generated image will appear here</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="prompt">Prompt</Label>
                                <Textarea
                                    id="prompt"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Describe the image you want to create..."
                                    className="min-h-[120px]"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="size">Size</Label>
                                <Select value={size} onValueChange={setSize}>
                                    <SelectTrigger id="size">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1024x1024">Square (1024x1024)</SelectItem>
                                        <SelectItem value="1024x1792">Portrait (1024x1792)</SelectItem>
                                        <SelectItem value="1792x1024">Landscape (1792x1024)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="quality">Quality</Label>
                                <Select value={quality} onValueChange={setQuality}>
                                    <SelectTrigger id="quality">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="standard">Standard</SelectItem>
                                        <SelectItem value="hd">HD (2x credits)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                onClick={handleGenerate}
                                disabled={loading || !prompt.trim()}
                                className="w-full"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <ImageIcon className="mr-2 h-4 w-4" />
                                        Generate Image
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Credit Cost</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-2">
                            <p>• Square: 10 credits</p>
                            <p>• Portrait/Landscape: 15 credits</p>
                            <p>• HD Quality: 2x credits</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
