
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Tv, Play, ChevronDown } from 'lucide-react';
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

const BATCH_SIZE = 100;

export default function ChannelList({ channels, onSelectChannel, selectedChannelId }: ChannelListProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);

  // Reset visible count when search or category changes
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [search, selectedCategory]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    channels.forEach(c => {
      const cat = c.category || c.groupTitle || 'General';
      if (cat) cats.add(cat);
    });
    return Array.from(cats).sort();
  }, [channels]);

  const filteredChannels = useMemo(() => {
    return channels.filter(c => {
      const channelName = (c.name || '').toLowerCase();
      const searchTerm = search.toLowerCase();
      const matchesSearch = channelName.includes(searchTerm);
      const channelCat = c.category || c.groupTitle || 'General';
      const matchesCategory = !selectedCategory || channelCat === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [channels, search, selectedCategory]);

  const displayedChannels = useMemo(() => {
    return filteredChannels.slice(0, visibleCount);
  }, [filteredChannels, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + BATCH_SIZE);
  };

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-3 space-y-3 border-b bg-card/50 backdrop-blur-md">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search channels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/50 transition-all rounded-full"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <Button
            variant={selectedCategory === null ? "default" : "secondary"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="h-7 px-3 text-[10px] uppercase font-bold rounded-full"
          >
            All
          </Button>
          {categories.slice(0, 15).map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "secondary"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="h-7 px-3 text-[10px] uppercase font-bold whitespace-nowrap rounded-full"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {displayedChannels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-30">
              <Tv className="w-12 h-12 mb-3" />
              <p className="text-sm font-medium">No channels found</p>
            </div>
          ) : (
            <>
              {displayedChannels.map((channel, index) => (
                <button
                  key={`${channel.id}-${index}`}
                  onClick={() => onSelectChannel(channel)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left group border border-transparent ${
                    selectedChannelId === channel.id 
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                      : 'hover:bg-muted/50 hover:border-white/5'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner ${
                    selectedChannelId === channel.id ? 'bg-white/20' : 'bg-black/20'
                  }`}>
                    {channel.logo ? (
                      <img 
                        src={channel.logo} 
                        alt="" 
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }} 
                      />
                    ) : (
                      <Tv className="w-5 h-5 opacity-40" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate leading-tight mb-1">{channel.name}</p>
                    <div className="flex items-center gap-1.5">
                      <Badge 
                        variant="outline" 
                        className={`text-[8px] px-1 py-0 h-3.5 border-none uppercase tracking-tighter ${
                          selectedChannelId === channel.id ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {channel.category || channel.groupTitle || 'General'}
                      </Badge>
                    </div>
                  </div>

                  {selectedChannelId !== channel.id && (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                      <Play className="w-3 h-3 text-primary fill-current" />
                    </div>
                  )}
                </button>
              ))}

              {visibleCount < filteredChannels.length && (
                <div className="py-4 px-2">
                  <Button
                    variant="ghost"
                    className="w-full h-12 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/30 group"
                    onClick={handleLoadMore}
                  >
                    <ChevronDown className="w-4 h-4 mr-2 transition-transform group-hover:translate-y-0.5" />
                    Show {Math.min(BATCH_SIZE, filteredChannels.length - visibleCount)} More Channels
                    <span className="ml-2 opacity-40">({filteredChannels.length - visibleCount} left)</span>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
