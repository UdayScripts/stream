"use client";

import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Tv, Loader2, ChevronRight, Activity } from 'lucide-react';
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
    <div className="flex flex-col h-full overflow-hidden bg-card/30">
      <div className="p-4 space-y-4 border-b border-white/5 bg-card/60 backdrop-blur-xl">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search channel or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-black/20 border-white/5 h-10 rounded-xl focus:ring-primary/40"
          />
        </div>

        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 no-scrollbar">
          <Button
            variant={selectedCategory === null ? "default" : "secondary"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="text-[10px] h-7 px-4 rounded-full font-bold uppercase tracking-tight"
          >
            All Channels
          </Button>
          {categories.slice(0, 8).map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "secondary"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="text-[10px] h-7 px-4 rounded-full font-bold uppercase tracking-tight"
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
              className="text-[10px] h-7 px-4 rounded-full border-primary/40 hover:border-primary text-primary font-bold uppercase tracking-tight bg-primary/5"
            >
              {isCategorizing ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <Sparkles className="w-3 h-3 mr-1.5" />}
              AI Categorize
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {filteredChannels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50">
              <Tv className="w-16 h-16 mb-4" />
              <p className="text-sm font-medium">No streams match your filter</p>
            </div>
          ) : (
            filteredChannels.map((channel, index) => (
              <button
                key={`${channel.id}-${index}`}
                onClick={() => onSelectChannel(channel)}
                className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all group relative overflow-hidden ${
                  selectedChannelId === channel.id 
                    ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-[1.02]' 
                    : 'hover:bg-white/5 text-foreground/70 hover:text-foreground'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm transition-transform group-hover:scale-105 ${
                  selectedChannelId === channel.id ? 'bg-white/20' : ''
                }`}>
                  {channel.logo ? (
                    <img src={channel.logo} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <Tv className={`w-6 h-6 ${selectedChannelId === channel.id ? 'text-white' : 'text-muted-foreground'}`} />
                  )}
                </div>
                
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold truncate leading-tight">{channel.name}</p>
                    {selectedChannelId === channel.id && <Activity className="w-3 h-3 animate-pulse" />}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 border-none rounded-sm uppercase tracking-tighter ${
                      selectedChannelId === channel.id ? 'bg-white/20 text-white' : 'bg-white/5 text-muted-foreground'
                    }`}>
                      {aiCategories[channel.name] || channel.category || 'General'}
                    </Badge>
                  </div>
                </div>

                {selectedChannelId === channel.id ? (
                  <ChevronRight className="w-5 h-5 text-white animate-bounce-x" />
                ) : (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-4 h-4 text-primary" />
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-white/5 bg-black/20 text-[10px] text-muted-foreground flex items-center justify-between font-bold uppercase tracking-widest">
        <span>Channel Count</span>
        <span className="text-foreground">{filteredChannels.length}</span>
      </div>
    </div>
  );
}