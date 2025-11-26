'use client';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

interface ParameterControlsProps {
    temperature: number;
    maxTokens: number;
    onTemperatureChange: (value: number) => void;
    onMaxTokensChange: (value: number) => void;
}

export function ParameterControls({
    temperature,
    maxTokens,
    onTemperatureChange,
    onMaxTokensChange,
}: ParameterControlsProps) {
    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label htmlFor="temperature">Temperature</Label>
                    <span className="text-sm text-muted-foreground">{temperature.toFixed(2)}</span>
                </div>
                <Slider
                    id="temperature"
                    min={0}
                    max={2}
                    step={0.1}
                    value={[temperature]}
                    onValueChange={(values) => onTemperatureChange(values[0])}
                />
                <p className="text-xs text-muted-foreground">
                    Lower values make output more focused and deterministic. Higher values make it more creative.
                </p>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label htmlFor="maxTokens">Max Tokens</Label>
                    <Input
                        type="number"
                        value={maxTokens}
                        onChange={(e) => onMaxTokensChange(parseInt(e.target.value) || 100)}
                        className="w-24 h-8 text-sm"
                        min={100}
                        max={4000}
                    />
                </div>
                <Slider
                    id="maxTokens"
                    min={100}
                    max={4000}
                    step={100}
                    value={[maxTokens]}
                    onValueChange={(values) => onMaxTokensChange(values[0])}
                />
                <p className="text-xs text-muted-foreground">
                    Maximum number of tokens to generate. ~1 token ≈ 4 characters.
                </p>
            </div>
        </div>
    );
}
