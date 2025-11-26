'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Sparkles, FileText, Code, Image, Mic, FileAudio } from 'lucide-react';

interface Preset {
    id: string;
    title: string;
    description: string;
    type: string;
    image?: string;
    color?: string;
    category?: {
        id: string;
        title: string;
    };
}

interface PresetCardProps {
    preset: Preset;
}

const typeIcons: Record<string, any> = {
    writer: FileText,
    coder: Code,
    image: Image,
    voiceover: Mic,
    transcription: FileAudio,
};

const typeColors: Record<string, string> = {
    writer: 'bg-blue-500',
    coder: 'bg-green-500',
    image: 'bg-purple-500',
    voiceover: 'bg-orange-500',
    transcription: 'bg-pink-500',
};

export function PresetCard({ preset }: PresetCardProps) {
    const Icon = typeIcons[preset.type] || Sparkles;
    const colorClass = preset.color || typeColors[preset.type] || 'bg-gray-500';

    return (
        <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div
                        className={`${colorClass} p-3 rounded-lg text-white mb-3`}
                    >
                        <Icon className="h-6 w-6" />
                    </div>
                    {preset.category && (
                        <Badge variant="secondary" className="text-xs">
                            {preset.category.title}
                        </Badge>
                    )}
                </div>
                <CardTitle className="text-lg line-clamp-2">{preset.title}</CardTitle>
                <CardDescription className="line-clamp-3">
                    {preset.description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild className="w-full" variant="default">
                    <Link href={`/presets/${preset.id}`}>
                        Use This Preset
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
