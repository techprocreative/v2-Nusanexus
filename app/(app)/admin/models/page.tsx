import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModelList } from '@/components/admin/model-list';

export default async function ModelsPage() {
    const supabase = createClient();

    // Check if user is admin
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        redirect('/dashboard');
    }

    // Fetch all models with provider info
    const { data: models } = await supabase
        .from('ai_models')
        .select(
            `
      *,
      provider:ai_providers(display_name)
    `
        )
        .order('display_name', { ascending: true });

    const llmModels = models?.filter((m: any) => m.type === 'llm') || [];
    const imageModels = models?.filter((m: any) => m.type === 'image') || [];
    const ttsModels = models?.filter((m: any) => m.type === 'tts') || [];
    const transcriptionModels = models?.filter((m: any) => m.type === 'transcription') || [];

    return (
        <div className="container mx-auto py-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">AI Models</h1>
                <p className="text-muted-foreground mt-1">
                    Manage model pricing and availability across all providers
                </p>
            </div>

            <Tabs defaultValue="llm" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="llm">LLM ({llmModels.length})</TabsTrigger>
                    <TabsTrigger value="image">Image ({imageModels.length})</TabsTrigger>
                    <TabsTrigger value="tts">TTS ({ttsModels.length})</TabsTrigger>
                    <TabsTrigger value="transcription">
                        Transcription ({transcriptionModels.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="llm" className="space-y-4">
                    <div className="bg-card rounded-lg border p-6">
                        <ModelList models={llmModels} type="llm" />
                    </div>
                </TabsContent>

                <TabsContent value="image" className="space-y-4">
                    <div className="bg-card rounded-lg border p-6">
                        <ModelList models={imageModels} type="image" />
                    </div>
                </TabsContent>

                <TabsContent value="tts" className="space-y-4">
                    <div className="bg-card rounded-lg border p-6">
                        <ModelList models={ttsModels} type="tts" />
                    </div>
                </TabsContent>

                <TabsContent value="transcription" className="space-y-4">
                    <div className="bg-card rounded-lg border p-6">
                        <ModelList models={transcriptionModels} type="transcription" />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
