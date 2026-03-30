"use client";

import React, { useState, useMemo } from 'react';
import { Search, Tv, Play } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { IPTVChannel } from '@/lib/m3u-parser';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface ChannelListProps {
  channels: IPTVChannel[];
  onSelectChannel: (channel: IPTVChannel) => void;
  selectedChannelId?: string;
}

export default function ChannelList({ channels, onSelectChannel, selectedChannelId }: ChannelListProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    channels.forEach(c => cats.add(c.category || 'General'));
    return Array.from(cats).sort();
  }, [channels]);

  const filteredChannels = useMemo(() => {
    return channels.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !selectedCategory || (c.category || 'General') === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [channels, search, selectedCategory]);

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-3 space-y-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search channels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-muted/30"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <Button
            variant={selectedCategory === null ? "default" : "secondary"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="h-6 px-2.5 text-[10px] uppercase font-bold"
          >
            All
          </Button>
          {categories.slice(0, 10).map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "secondary"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="h-6 px-2.5 text-[10px] uppercase font-bold whitespace-nowrap"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredChannels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground opacity-50">
              <Tv className="w-8 h-8 mb-2" />
              <p className="text-xs">No results</p>
            </div>
          ) : (
            filteredChannels.map((channel, index) => (
              <button
                key={`${channel.id}-${index}`}
                onClick={() => onSelectChannel(channel)}
                className={`w-full flex items-center gap-3 p-2 rounded-md transition-all text-left group ${
                  selectedChannelId === channel.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                }`}
              >
                <div className={`w-8 h-8 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 ${
                  selectedChannelId === channel.id ? 'bg-white/20' : ''
                }`}>
                  {channel.logo ? (
                    <img src={channel.logo} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <Tv className="w-4 h-4" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate leading-none mb-1">{channel.name}</p>
                  <p className={`text-[9px] uppercase tracking-wider opacity-70 ${
                    selectedChannelId === channel.id ? 'text-white' : 'text-muted-foreground'
                  }`}>
                    {channel.category || 'General'}
                  </p>
                </div>

                {selectedChannelId !== channel.id && (
                  <Play className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
