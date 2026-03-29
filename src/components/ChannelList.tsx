"use client";

import React, { useState, useMemo } from 'react';
import { Search, Filter, Sparkles, Tv, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { IPTVChannel } from '@/lib/m3u-parser';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { categorizePlaylist } from '@/ai/flows/ai-playlist-categorization';

interface ChannelListProps {
  channels: IPTVChannel[];
  onSelectChannel: (channel: IPTVChannel) => void;
  selectedChannelId?: string;
}

export default function ChannelList({ channels, onSelectChannel, selectedChannelId }: ChannelListProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [aiCategories, setAiCategories] = useState<Record<string, string>>({});

  const categories = useMemo(() => {
    const cats = new Set<string>();
    channels.forEach(c => {
      const cat = aiCategories[c.name] || c.category || c.groupTitle || 'General';
      cats.add(cat);
    });
    return Array.from(cats).sort();
  }, [channels, aiCategories]);

  const filteredChannels = useMemo(() => {
    return channels.filter(c => {
      const category = aiCategories[c.name] || c.category || c.groupTitle || 'General';
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !selectedCategory || category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [channels, search, selectedCategory, aiCategories]);

  const handleAiCategorize = async () => {
    if (channels.length === 0) return;
    setIsCategorizing(true);
    try {
      // Limit to first 50 channels for AI to prevent huge payloads for this demo tool
      const namesToCategorize = channels.slice(0, 50).map(c => c.name);
      const result = await categorizePlaylist({ channelNames: namesToCategorize });
      
      const newMapping: Record<string, string> = {};
      result.categorizedChannels.forEach(item => {
        newMapping[item.name] = item.category;
      });
      setAiCategories(prev => ({ ...prev, ...newMapping }));
    } catch (error) {
      console.error('Failed to categorize:', error);
    } finally {
      setIsCategorizing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card/50 rounded-xl border border-white/5 overflow-hidden">
      <div className="p-4 space-y-4 border-b border-white/5 bg-card/80 backdrop-blur-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search channels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/50 border-white/10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="text-xs h-7 rounded-full"
          >
            All
          </Button>
          {categories.slice(0, 5).map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="text-xs h-7 rounded-full"
            >
              {cat}
            </Button>
          ))}
          {channels.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAiCategorize}
              disabled={isCategorizing}
              className="text-xs h-7 rounded-full border-primary/30 hover:border-primary/60 text-primary"
            >
              {isCategorizing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
              AI Categorize
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredChannels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Tv className="w-12 h-12 mb-2 opacity-10" />
              <p className="text-sm">No channels found</p>
            </div>
          ) : (
            filteredChannels.map((channel) => (
              <button
                key={`${channel.id}-${channel.url}`}
                onClick={() => onSelectChannel(channel)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all group ${
                  selectedChannelId === channel.id 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                    : 'hover:bg-white/5 text-foreground/80 hover:text-foreground'
                }`}
              >
                <div className={`w-10 h-10 rounded-md bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 ${
                  selectedChannelId === channel.id ? 'bg-white/20' : ''
                }`}>
                  {channel.logo ? (
                    <img src={channel.logo} alt={channel.name} className="w-full h-full object-contain" />
                  ) : (
                    <Tv className={`w-5 h-5 ${selectedChannelId === channel.id ? 'text-white' : 'text-muted-foreground'}`} />
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold truncate">{channel.name}</p>
                  <p className={`text-xs truncate ${selectedChannelId === channel.id ? 'text-white/70' : 'text-muted-foreground'}`}>
                    {aiCategories[channel.name] || channel.category || 'General'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
      
      <div className="p-3 border-t border-white/5 bg-card/80 text-[10px] text-muted-foreground text-center">
        {filteredChannels.length} Channels Loaded
      </div>
    </div>
  );
}
