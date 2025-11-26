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
import { Loader2, Copy, Code as CodeIcon } from 'lucide-react';
import hljs from 'highlight.js';

const LANGUAGES = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'php', label: 'PHP' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'csharp', label: 'C#' },
    { value: 'cpp', label: 'C++' },
];

export default function CodeGeneratorPage() {
    const searchParams = useSearchParams();
    const presetId = searchParams.get('preset');
    const { toast } = useToast();

    const [prompt, setPrompt] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [loading, setLoading] = useState(false);
    const [generatedCode, setGeneratedCode] = useState('');
    const [explanation, setExplanation] = useState('');
    const [preset, setPreset] = useState<any>(null);

    useEffect(() => {
        if (presetId) {
            fetchPreset(presetId);
        }
    }, [presetId]);

    useEffect(() => {
        if (generatedCode) {
            document.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block as HTMLElement);
            });
        }
    }, [generatedCode]);

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
        setGeneratedCode('');
        setExplanation('');

        try {
            const response = await fetch('/api/ai/code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    language,
                    presetId: presetId || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate code');
            }

            if (data.code) {
                setGeneratedCode(data.code);
                setExplanation(data.explanation || '');
                toast({
                    title: 'Success!',
                    description: `Code generated using ${data.usage?.credits || 0} credits`,
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

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(generatedCode);
            toast({
                title: 'Copied!',
                description: 'Code copied to clipboard',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to copy code',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">AI Code Generator</h1>
                <p className="text-muted-foreground">
                    Generate clean, well-documented code in multiple languages
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
                                <Label htmlFor="prompt">Describe what you want to build</Label>
                                <Textarea
                                    id="prompt"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="e.g., Create a function to validate email addresses..."
                                    className="min-h-[120px]"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="language">Programming Language</Label>
                                <Select value={language} onValueChange={setLanguage}>
                                    <SelectTrigger id="language">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {LANGUAGES.map((lang) => (
                                            <SelectItem key={lang.value} value={lang.value}>
                                                {lang.label}
                                            </SelectItem>
                                        ))}
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
                                        <CodeIcon className="mr-2 h-4 w-4" />
                                        Generate Code
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {(generatedCode || loading) && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Generated Code</CardTitle>
                                    {generatedCode && (
                                        <Button variant="outline" size="sm" onClick={handleCopy}>
                                            <Copy className="h-4 w-4 mr-2" />
                                            Copy
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-center">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                                            <p className="text-muted-foreground">Generating code...</p>
                                        </div>
                                    </div>
                                ) : (
                                    <pre className="rounded-lg overflow-x-auto">
                                        <code className={`language-${language}`}>{generatedCode}</code>
                                    </pre>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {explanation && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Explanation</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {explanation}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tips</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                            <p>• Be specific about what you want the code to do</p>
                            <p>• Mention any specific libraries or frameworks</p>
                            <p>• Specify input/output requirements</p>
                            <p>• Request error handling if needed</p>
                            <p>• Ask for comments and documentation</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Supported Languages</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            <div className="grid grid-cols-2 gap-2">
                                {LANGUAGES.map((lang) => (
                                    <div key={lang.value}>• {lang.label}</div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
