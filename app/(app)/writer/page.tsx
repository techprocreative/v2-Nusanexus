'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PromptInput } from '@/components/writer/prompt-input';
import { ModelSelector } from '@/components/writer/model-selector';
import { ParameterControls } from '@/components/writer/parameter-controls';
import { OutputDisplay } from '@/components/writer/output-display';
import { useToast } from '@/components/ui/use-toast';
import { Sparkles } from 'lucide-react';

export default function WriterPage() {
    const searchParams = useSearchParams();
    const presetId = searchParams.get('preset');
    const fromLibraryId = searchParams.get('fromLibrary');
    const { toast } = useToast();

    const [prompt, setPrompt] = useState('');
    const [model, setModel] = useState('gpt-3.5-turbo');
    const [temperature, setTemperature] = useState(0.7);
    const [maxTokens, setMaxTokens] = useState(2000);
    const [output, setOutput] = useState('');
    const [loading, setLoading] = useState(false);
    const [preset, setPreset] = useState<any>(null);

    useEffect(() => {
        if (presetId) {
            fetchPreset(presetId);
        }
    }, [presetId]);

    useEffect(() => {
        if (fromLibraryId) {
            fetchLibraryItem(fromLibraryId);
        }
    }, [fromLibraryId]);

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

    const fetchLibraryItem = async (id: string) => {
        try {
            const response = await fetch(`/api/library/${id}`);
            const data = await response.json();

            if (response.ok && data.item) {
                // Use existing content as the starting prompt to refine or extend
                if (data.item.content) {
                    setPrompt(data.item.content);
                }
                if (data.item.model) {
                    setModel(data.item.model);
                }
            }
        } catch (error) {
            console.error('Error fetching library item:', error);
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
        setOutput('');

        try {
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    model,
                    type: 'document',
                    presetId: presetId || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate content');
            }

            if (data.item?.content) {
                setOutput(data.item.content);
                toast({
                    title: 'Success!',
                    description: `Generated ${data.usage?.tokens || 0} tokens using ${data.usage?.credits?.toFixed(2) || 0} credits`,
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

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">AI Writer</h1>
                <p className="text-muted-foreground">
                    Generate high-quality content using AI language models
                </p>
                {preset && (
                    <div className="mt-3 flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Using preset:</span>
                        <span className="text-sm font-medium">{preset.title}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Input */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Input</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <PromptInput
                                value={prompt}
                                onChange={setPrompt}
                                template={preset?.template}
                            />

                            <Button
                                onClick={handleGenerate}
                                disabled={loading || !prompt.trim()}
                                size="lg"
                                className="w-full"
                            >
                                {loading ? (
                                    <>
                                        <Sparkles className="mr-2 h-5 w-5 animate-pulse" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-5 w-5" />
                                        Generate Content
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    <OutputDisplay content={output} loading={loading} />
                </div>

                {/* Right Column - Settings */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Model Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <ModelSelector value={model} onChange={setModel} />
                            <ParameterControls
                                temperature={temperature}
                                maxTokens={maxTokens}
                                onTemperatureChange={setTemperature}
                                onMaxTokensChange={setMaxTokens}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Tips</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                            <p>• Be specific and clear in your prompts</p>
                            <p>• Use lower temperature (0.3-0.7) for factual content</p>
                            <p>• Use higher temperature (0.7-1.0) for creative writing</p>
                            <p>• Template variables like {`{{topic}}`} will be preserved</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
