'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, FileText, Image, Code, Mic, FileAudio, MessageSquare, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface LibraryItem {
  id: string;
  type: string;
  title: string;
  content: string;
  model: string;
  used_credit_count: number;
  created_at: string;
  presets?: {
    title: string;
  };
}

const typeIcons: Record<string, any> = {
  document: FileText,
  image: Image,
  code: Code,
  speech: Mic,
  transcription: FileAudio,
  conversation: MessageSquare,
};

const typeColors: Record<string, string> = {
  document: 'bg-blue-500',
  image: 'bg-purple-500',
  code: 'bg-green-500',
  speech: 'bg-orange-500',
  transcription: 'bg-pink-500',
  conversation: 'bg-indigo-500',
};

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/library');
      const data = await response.json();

      if (response.ok) {
        setItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching library items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'all' || item.type === typeFilter;

    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Library</h1>
        <p className="text-muted-foreground">
          {items.length} items in your library
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="code">Code</SelectItem>
            <SelectItem value="speech">Audio</SelectItem>
            <SelectItem value="transcription">Transcription</SelectItem>
            <SelectItem value="conversation">Conversations</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-muted-foreground">
              {searchQuery || typeFilter !== 'all' ? (
                <>
                  <p className="text-lg mb-2">No items found</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </>
              ) : (
                <>
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No items yet</p>
                  <p className="text-sm">Start generating content to fill your library</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const Icon = typeIcons[item.type] || FileText;
            const colorClass = typeColors[item.type] || 'bg-gray-500';

            const showWriterAction =
              item.type === 'document' || item.type === 'code';

            return (
              <Card
                key={item.id}
                className="h-full hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`${colorClass} p-2 rounded-lg text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {item.type}
                    </Badge>
                  </div>

                  <h3 className="font-semibold mb-2 line-clamp-2">
                    {item.title || 'Untitled'}
                  </h3>

                  {item.type === 'image' ? (
                    <div className="aspect-video bg-muted rounded-lg mb-3 overflow-hidden">
                      <img
                        src={item.content}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                      {item.content}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    {item.used_credit_count > 0 && (
                      <span>{item.used_credit_count} credits</span>
                    )}
                  </div>

                  {item.presets && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        {item.presets.title}
                      </Badge>
                    </div>
                  )}

                  {showWriterAction && (
                    <div className="mt-4 flex justify-end">
                      <Link href={`/writer?fromLibrary=${item.id}`}>
                        <Button variant="outline" size="xs">
                          Open in Writer
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
