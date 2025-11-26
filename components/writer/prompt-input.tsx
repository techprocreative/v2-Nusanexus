'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PromptInputProps {
    value: string;
    onChange: (value: string) => void;
    template?: string;
    onInsertVariable?: (variable: string) => void;
}

export function PromptInput({ value, onChange, template, onInsertVariable }: PromptInputProps) {
    const [variables, setVariables] = useState<string[]>([]);

    // Extract variables from template
    useState(() => {
        if (template) {
            const matches = template.match(/\{\{([^}]+)\}\}/g);
            if (matches) {
                const vars = matches.map((m) => m.replace(/\{\{|\}\}/g, '').trim());
                setVariables([...new Set(vars)]);
            }
        }
    });

    const handleInsertVariable = (variable: string) => {
        const newValue = value + `{{${variable}}}`;
        onChange(newValue);
        if (onInsertVariable) {
            onInsertVariable(variable);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label htmlFor="prompt">Prompt</Label>
                {template && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onChange(template)}
                    >
                        Load Template
                    </Button>
                )}
            </div>

            <Textarea
                id="prompt"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Enter your prompt here..."
                className="min-h-[200px] font-mono text-sm"
            />

            {variables.length > 0 && (
                <div>
                    <p className="text-xs text-muted-foreground mb-2">Template Variables:</p>
                    <div className="flex flex-wrap gap-2">
                        {variables.map((variable) => (
                            <Badge
                                key={variable}
                                variant="secondary"
                                className="cursor-pointer hover:bg-secondary/80"
                                onClick={() => handleInsertVariable(variable)}
                            >
                                {`{{${variable}}}`}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            <p className="text-xs text-muted-foreground">
                {value.length} characters • {value.split(/\s+/).filter(Boolean).length} words
            </p>
        </div>
    );
}
