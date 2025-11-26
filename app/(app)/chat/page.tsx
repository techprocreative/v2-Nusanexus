'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Send, Plus, Trash2 } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface Conversation {
    id: string;
    title: string;
    message_count: number;
    updated_at: string;
}

export default function ChatPage() {
    const { toast } = useToast();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchConversations = async () => {
        try {
            const response = await fetch('/api/conversations');
            const data = await response.json();
            if (response.ok) {
                setConversations(data.conversations || []);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    conversationId: currentConversationId,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send message');
            }

            setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);

            if (!currentConversationId) {
                setCurrentConversationId(data.conversationId);
                fetchConversations();
            }

            toast({
                title: 'Message sent',
                description: `Used ${data.usage?.credits || 0} credits`,
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
            setMessages((prev) => prev.slice(0, -1));
        } finally {
            setLoading(false);
        }
    };

    const handleNewChat = () => {
        setCurrentConversationId(null);
        setMessages([]);
    };

    const handleDeleteConversation = async (id: string) => {
        try {
            const response = await fetch(`/api/conversations?id=${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setConversations((prev) => prev.filter((c) => c.id !== id));
                if (currentConversationId === id) {
                    handleNewChat();
                }
                toast({
                    title: 'Deleted',
                    description: 'Conversation deleted successfully',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete conversation',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="container mx-auto py-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <Card className="h-full">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Conversations</CardTitle>
                                <Button size="sm" onClick={handleNewChat}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[calc(100vh-18rem)]">
                                <div className="space-y-2">
                                    {conversations.map((conv) => (
                                        <div
                                            key={conv.id}
                                            className={`p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors ${currentConversationId === conv.id ? 'bg-muted' : ''
                                                }`}
                                            onClick={() => setCurrentConversationId(conv.id)}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">{conv.title}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {conv.message_count} messages
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteConversation(conv.id);
                                                    }}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>

                {/* Chat Area */}
                <div className="lg:col-span-3">
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle>AI Chat</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col p-0">
                            <ScrollArea className="flex-1 p-6">
                                {messages.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <p>Start a conversation with AI</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {messages.map((msg, idx) => (
                                            <div
                                                key={idx}
                                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[80%] rounded-lg p-4 ${msg.role === 'user'
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'bg-muted'
                                                        }`}
                                                >
                                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {loading && (
                                            <div className="flex justify-start">
                                                <div className="bg-muted rounded-lg p-4">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                </div>
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </ScrollArea>

                            <div className="p-6 border-t">
                                <div className="flex gap-2">
                                    <Input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                        placeholder="Type your message..."
                                        disabled={loading}
                                    />
                                    <Button onClick={handleSend} disabled={loading || !input.trim()}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
