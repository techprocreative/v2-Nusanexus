'use client';

import { useState, useEffect } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface Model {
    id: string;
    model_id: string;
    display_name: string;
    type: string;
    context_length?: number;
    input_cost?: number;
    output_cost?: number;
    metadata?: Record<string, any>;
    provider?: {
        display_name: string;
    };
}

interface ModelSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
    const [models, setModels] = useState<Model[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchModels();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchModels = async () => {
        try {
            const response = await fetch('/api/ai/models?type=llm');
            const data = await response.json();

            if (response.ok) {
                const modelsData: Model[] = data.models || data || [];
                setModels(modelsData);

                if (modelsData.length > 0) {
                    const hasSelected = modelsData.some((m) => m.model_id === value);
                    if (!value || !hasSelected) {
                        onChange(modelsData[0].model_id);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching models:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectedModel = models.find((m) => m.model_id === value);

    return (
        <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select value={value} onValueChange={onChange} disabled={loading}>
                <SelectTrigger id="model">
                    <SelectValue placeholder={loading ? 'Loading models...' : 'Select a model'} />
                </SelectTrigger>
                <SelectContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                    ) : models.length === 0 ? (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                            No models available
                        </div>
                    ) : (
                        models.map((model) => (
                            <SelectItem key={model.id} value={model.model_id}>
                                <div className="flex items-center justify-between w-full">
                                    <span>{model.display_name}</span>
                                    {model.provider && (
                                        <Badge variant="outline" className="ml-2 text-xs">
                                            {model.provider.display_name}
                                        </Badge>
                                    )}
                                </div>
                            </SelectItem>
                        ))
                    )}
                </SelectContent>
            </Select>

            {selectedModel && (
                <div className="text-xs text-muted-foreground space-y-1">
                    {selectedModel.context_length && (
                        <p>Context: {selectedModel.context_length.toLocaleString()} tokens</p>
                    )}
                    {selectedModel.input_cost != null && selectedModel.output_cost != null && (
                        <p>
                            Cost: ${selectedModel.input_cost.toFixed(6)}/input token, $
                            {selectedModel.output_cost.toFixed(6)}/output token
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
