'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Upload, FileAudio, Download } from 'lucide-react';

const LANGUAGES = [
    { value: '', label: 'Auto-detect' },
    { value: 'en', label: 'English' },
    { value: 'id', label: 'Indonesian' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' },
    { value: 'zh', label: 'Chinese' },
];

export default function TranscriptionPage() {
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [language, setLanguage] = useState('');
    const [loading, setLoading] = useState(false);
    const [transcription, setTranscription] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            // Check file type
            const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/webm'];
            if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(mp3|wav|m4a|webm)$/i)) {
                toast({
                    title: 'Invalid file type',
                    description: 'Please upload an audio file (MP3, WAV, M4A, or WebM)',
                    variant: 'destructive',
                });
                return;
            }

            // Check file size (max 25MB)
            if (selectedFile.size > 25 * 1024 * 1024) {
                toast({
                    title: 'File too large',
                    description: 'Maximum file size is 25MB',
                    variant: 'destructive',
                });
                return;
            }

            setFile(selectedFile);
        }
    };

    const handleTranscribe = async () => {
        if (!file) {
            toast({
                title: 'Error',
                description: 'Please select an audio file',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        setTranscription('');

        try {
            const formData = new FormData();
            formData.append('file', file);
            if (language) {
                formData.append('language', language);
            }

            const response = await fetch('/api/ai/transcribe', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to transcribe audio');
            }

            if (data.transcription) {
                setTranscription(data.transcription);
                toast({
                    title: 'Success!',
                    description: `Transcription completed using ${data.usage?.credits || 0} credits`,
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
        const blob = new Blob([transcription], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcription-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Audio Transcription</h1>
                <p className="text-muted-foreground">
                    Convert audio files to text using Whisper AI
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload Audio</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="file">Audio File</Label>
                                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                                    <input
                                        id="file"
                                        type="file"
                                        accept="audio/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <label htmlFor="file" className="cursor-pointer">
                                        {file ? (
                                            <div className="space-y-2">
                                                <FileAudio className="h-12 w-12 mx-auto text-primary" />
                                                <p className="font-medium">{file.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                                <Button variant="outline" size="sm" type="button">
                                                    Change File
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                                                <p className="text-muted-foreground">
                                                    Click to upload or drag and drop
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    MP3, WAV, M4A, or WebM (max 25MB)
                                                </p>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="language">Language (Optional)</Label>
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
                                onClick={handleTranscribe}
                                disabled={loading || !file}
                                className="w-full"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Transcribing...
                                    </>
                                ) : (
                                    <>
                                        <FileAudio className="mr-2 h-4 w-4" />
                                        Transcribe Audio
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {(transcription || loading) && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Transcription</CardTitle>
                                    {transcription && (
                                        <Button variant="outline" size="sm" onClick={handleDownload}>
                                            <Download className="h-4 w-4 mr-2" />
                                            Download
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-center">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                                            <p className="text-muted-foreground">Transcribing audio...</p>
                                        </div>
                                    </div>
                                ) : (
                                    <Textarea
                                        value={transcription}
                                        onChange={(e) => setTranscription(e.target.value)}
                                        className="min-h-[300px] font-mono text-sm"
                                        placeholder="Transcription will appear here..."
                                    />
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Supported Formats</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-2">
                            <p>• MP3</p>
                            <p>• WAV</p>
                            <p>• M4A</p>
                            <p>• WebM</p>
                            <p className="pt-2">Maximum file size: 25MB</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Credit Cost</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            <p>5 credits per transcription</p>
                            <p className="mt-2 text-xs">Fixed cost regardless of audio length</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Tips</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-2">
                            <p>• Clear audio produces better results</p>
                            <p>• Specify language for better accuracy</p>
                            <p>• You can edit the transcription after generation</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
