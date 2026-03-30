"use client";

import React, { useState, useEffect } from 'react';
import { List, Play, History, Globe, Trash2, Menu, Tv, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { parseM3U, IPTVChannel } from '@/lib/m3u-parser';
import StreamPlayer from '@/components/StreamPlayer';
import ChannelList from '@/components/ChannelList';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function StreamGlide() {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [channels, setChannels] = useState<IPTVChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<IPTVChannel | null>(null);
  const [savedPlaylists, setSavedPlaylists] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('streamglide_playlists');
    if (saved) {
      setSavedPlaylists(JSON.parse(saved));
    }
  }, []);

  const savePlaylist = (url: string) => {
    if (!url) return;
    if (!savedPlaylists.includes(url)) {
      const updated = [url, ...savedPlaylists].slice(0, 5);
      setSavedPlaylists(updated);
      localStorage.setItem('streamglide_playlists', JSON.stringify(updated));
    }
  };

  const removePlaylist = (url: string) => {
    const updated = savedPlaylists.filter(p => p !== url);
    setSavedPlaylists(updated);
    localStorage.setItem('streamglide_playlists', JSON.stringify(updated));
  };

  const loadPlaylist = async (url: string) => {
    if (!url) return;
    setIsLoading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch playlist');
      const content = await response.text();
      const parsedChannels = parseM3U(content);
      if (parsedChannels.length === 0) throw new Error('No valid channels found');
      
      setChannels(parsedChannels);
      savePlaylist(url);
      setPlaylistUrl(url);
      toast({
        title: "Success",
        description: `Loaded ${parsedChannels.length} channels.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Invalid playlist URL or network error.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChannelSelect = (channel: IPTVChannel) => {
    setSelectedChannel(channel);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <header className="h-16 flex items-center justify-between px-4 border-b bg-card/30 backdrop-blur-xl z-30">
        <div className="flex items-center gap-3">
          {channels.length > 0 && (
            <div className="lg:hidden">
              <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full bg-muted/50">
                    <List className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="p-0 h-[85vh] rounded-t-[2.5rem] border-t-0 bg-card overflow-hidden shadow-2xl">
                  <div className="mx-auto mt-4 mb-2 h-1.5 w-12 rounded-full bg-muted-foreground/20 shrink-0" />
                  <div className="flex-1 h-full overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b flex items-center justify-between shrink-0">
                      <h2 className="text-xl font-bold">Channels</h2>
                      <Badge variant="secondary">{channels.length}</Badge>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <ChannelList
                        channels={channels}
                        onSelectChannel={handleChannelSelect}
                        selectedChannelId={selectedChannel?.id}
                      />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
            <Play className="w-6 h-6 text-primary fill-current" />
            <h1 className="text-lg font-bold tracking-tight hidden sm:block">StreamGlide</h1>
          </div>
        </div>

        <div className="flex-1 max-w-xl px-4">
          <div className="relative group">
            <Input
              placeholder="Paste M3U link..."
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              className="h-10 text-sm bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/50 transition-all rounded-full pl-4 pr-20"
              onKeyDown={(e) => e.key === 'Enter' && loadPlaylist(playlistUrl)}
            />
            <Button 
              onClick={() => loadPlaylist(playlistUrl)} 
              disabled={isLoading} 
              size="sm"
              className="absolute right-1 top-1 h-8 rounded-full px-4"
            >
              {isLoading ? "Loading" : "Load"}
            </Button>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-bold opacity-50">PRO PLAYER</Badge>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-black/20">
          <div className="h-full flex flex-col">
            {selectedChannel ? (
              <div className="flex-1 flex flex-col p-4 lg:p-8 space-y-6">
                <div className="w-full max-w-6xl mx-auto space-y-4">
                  <StreamPlayer
                    url={selectedChannel.url}
                    title={selectedChannel.name}
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/40 p-4 rounded-2xl border border-white/5">
                    <div className="space-y-1">
                      <h2 className="text-xl font-bold tracking-tight">{selectedChannel.name}</h2>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] h-5">
                          {selectedChannel.category || 'GENERAL'}
                        </Badge>
                        <span className="text-[10px] uppercase tracking-widest font-bold opacity-60">
                          {selectedChannel.groupTitle || 'LIVE STREAM'}
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="lg:hidden w-full sm:w-auto rounded-full" 
                      onClick={() => setIsSidebarOpen(true)}
                    >
                      <List className="w-4 h-4 mr-2" />
                      Browse Channels
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
                  <div className="relative w-24 h-24 bg-card rounded-3xl flex items-center justify-center border border-white/5 shadow-2xl">
                    <Tv className="w-10 h-10 text-primary" />
                  </div>
                </div>
                
                <div className="space-y-3 max-w-sm">
                  <h2 className="text-3xl font-bold tracking-tight">Ready to Stream?</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Paste your M3U playlist link above to unlock thousands of live channels and VOD content.
                  </p>
                </div>

                <div className="flex flex-col gap-3 w-full max-w-xs">
                  {savedPlaylists.length === 0 && (
                    <Button 
                      variant="default" 
                      className="rounded-full h-12 text-md font-bold shadow-lg shadow-primary/20"
                      onClick={() => loadPlaylist('https://iptv-org.github.io/iptv/index.m3u')}
                    >
                      Try Demo Playlist
                    </Button>
                  )}
                </div>

                {savedPlaylists.length > 0 && (
                  <div className="w-full max-w-md pt-12">
                    <div className="flex items-center justify-center gap-2 mb-6 opacity-60">
                      <History className="w-4 h-4" />
                      <h3 className="text-xs font-bold uppercase tracking-widest">Recent Playlists</h3>
                    </div>
                    <div className="grid gap-3">
                      {savedPlaylists.map(url => (
                        <div key={url} className="group flex items-center gap-3 p-3 rounded-2xl border bg-card/50 hover:bg-card hover:border-primary/50 transition-all cursor-pointer overflow-hidden">
                          <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0" onClick={() => loadPlaylist(url)}>
                            <Globe className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0 text-left" onClick={() => loadPlaylist(url)}>
                            <p className="text-sm font-medium truncate">{url}</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              removePlaylist(url);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {channels.length > 0 && (
          <aside className="hidden lg:flex w-96 border-l bg-card/30 backdrop-blur-md flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <span className="font-bold text-lg">Channels</span>
              <Badge variant="secondary" className="rounded-full px-3">{channels.length}</Badge>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChannelList
                channels={channels}
                onSelectChannel={handleChannelSelect}
                selectedChannelId={selectedChannel?.id}
              />
            </div>
          </aside>
        )}
      </main>
      <Toaster />
    </div>
  );
}
