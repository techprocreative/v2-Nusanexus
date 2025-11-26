'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ReactMarkdown from 'react-markdown';

interface OutputDisplayProps {
    content: string;
    loading?: boolean;
}

export function OutputDisplay({ content, loading }: OutputDisplayProps) {
    const { toast } = useToast();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content);
            toast({
                title: 'Copied!',
                description: 'Content copied to clipboard',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to copy content',
                variant: 'destructive',
            });
        }
    };

    const handleDownload = () => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `generated-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
            title: 'Downloaded!',
            description: 'Content saved to file',
        });
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                            <p className="text-muted-foreground">Generating content...</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!content) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center py-12 text-muted-foreground">
                        <p>Generated content will appear here</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Generated Content</h3>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleCopy}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownload}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                        </Button>
                    </div>
                </div>

                <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{content}</ReactMarkdown>
                </div>

                <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                    {content.length} characters • {content.split(/\s+/).filter(Boolean).length} words
                </div>
            </CardContent>
        </Card>
    );
}
