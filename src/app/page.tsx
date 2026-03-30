"use client";

import React, { useState, useEffect } from 'react';
import { List, Play, History, Globe, Trash2, Tv, Plus, Search, Instagram, Send } from 'lucide-react';
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
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { toast } = useToast();

  const DEFAULT_PLAYLIST = 'https://iptv-org.github.io/iptv/index.m3u';

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
      // Automatically open channels if none are selected
      if (!selectedChannel) setIsSheetOpen(true);
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
    setIsSheetOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <header className="h-16 flex items-center justify-between px-4 sm:px-8 border-b bg-card/30 backdrop-blur-xl z-30 shrink-0">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
          <Play className="w-6 h-6 text-primary fill-current" />
          <h1 className="text-lg font-bold tracking-tight hidden sm:block">StreamGlide</h1>
        </div>

        <div className="flex-1 max-w-xl px-4">
          <div className="relative group">
            <Input
              placeholder="Paste custom M3U link..."
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

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-bold opacity-50 hidden sm:flex">1080P ACTIVE</Badge>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {selectedChannel ? (
            <div className="h-full flex flex-col p-4 lg:p-8">
              <div className="w-full max-w-6xl mx-auto space-y-6">
                <StreamPlayer
                  url={selectedChannel.url}
                  title={selectedChannel.name}
                />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/40 p-5 rounded-3xl border border-white/5 backdrop-blur-sm">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight">{selectedChannel.name}</h2>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] h-5">
                        {selectedChannel.category || 'GENERAL'}
                      </Badge>
                      <span className="text-[10px] uppercase tracking-widest font-bold opacity-60">
                        {selectedChannel.groupTitle || 'LIVE STREAM'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <a 
                      href="https://t.me/UdayScripts" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      @UdayScripts
                    </a>
                    <a 
                      href="https://instagram.com/iamuday_x" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Instagram className="w-4 h-4" />
                      @iamuday_x
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="min-h-full flex flex-col items-center justify-center p-8 text-center space-y-8">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
                <div className="relative w-24 h-24 bg-card rounded-3xl flex items-center justify-center border border-white/5 shadow-2xl">
                  <Tv className="w-10 h-10 text-primary" />
                </div>
              </div>
              
              <div className="space-y-3 max-w-sm">
                <h2 className="text-4xl font-bold tracking-tight">Stream Anywhere</h2>
                <p className="text-muted-foreground leading-relaxed">
                  The ultimate destination for your favorite live channels.
                </p>
              </div>

              <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button 
                  variant="default" 
                  className="rounded-full h-14 text-lg font-bold shadow-lg shadow-primary/20 group overflow-hidden relative"
                  onClick={() => loadPlaylist(DEFAULT_PLAYLIST)}
                  disabled={isLoading}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {isLoading ? "Fetching Stream..." : "Watch Now"}
                    <Play className="w-5 h-5 fill-current group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </div>

              {savedPlaylists.length > 0 && (
                <div className="w-full max-w-md pt-12">
                  <div className="flex items-center justify-center gap-2 mb-6 opacity-40">
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

              <footer className="pt-12 pb-4 flex flex-col items-center gap-4">
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <a 
                    href="https://t.me/UdayScripts" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-white/5 text-sm font-medium text-muted-foreground hover:text-primary hover:border-primary/20 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    Join <span className="font-bold text-foreground ml-1">@UdayScripts</span>
                  </a>
                  <a 
                    href="https://instagram.com/iamuday_x" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-white/5 text-sm font-medium text-muted-foreground hover:text-primary hover:border-primary/20 transition-all"
                  >
                    <Instagram className="w-4 h-4" />
                    Follow <span className="font-bold text-foreground ml-1">iamuday_x</span>
                  </a>
                </div>
                <p className="text-[10px] text-muted-foreground/30 uppercase tracking-[0.2em] font-bold">
                  StreamGlide Premium © 2026
                </p>
              </footer>
            </div>
          )}
        </div>

        {channels.length > 0 && (
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button 
                size="icon" 
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl shadow-primary/40 bg-primary hover:scale-105 transition-transform z-50"
              >
                <List className="w-6 h-6 text-primary-foreground" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="p-0 h-[85vh] rounded-t-[2.5rem] border-t-0 bg-card overflow-hidden shadow-2xl">
              <div className="mx-auto mt-4 mb-2 h-1.5 w-12 rounded-full bg-muted-foreground/20 shrink-0" />
              <div className="flex-1 h-full overflow-hidden flex flex-col">
                <div className="px-8 py-4 border-b flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <Tv className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold">Channels</h2>
                  </div>
                  <Badge variant="secondary" className="rounded-full px-3">{channels.length}</Badge>
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
        )}
      </main>
      <Toaster />
    </div>
  );
}
