"use client";

import React, { useState, useEffect } from 'react';
import { Plus, List, Play, History, Globe, Trash2, ArrowRight, Menu, Zap, Shield, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { parseM3U, IPTVChannel } from '@/lib/m3u-parser';
import StreamPlayer from '@/components/StreamPlayer';
import ChannelList from '@/components/ChannelList';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';

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
    if (!savedPlaylists.includes(url)) {
      const updated = [url, ...savedPlaylists].slice(0, 10);
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
      setChannels(parsedChannels);
      savePlaylist(url);
      setPlaylistUrl(url);
      toast({
        title: "Playlist Loaded",
        description: `Successfully loaded ${parsedChannels.length} channels.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load the playlist. Check the URL and try again.",
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
      {/* Immersive Header */}
      <header className="h-20 flex items-center justify-between px-6 border-b border-white/5 bg-background/80 backdrop-blur-2xl z-30">
        <div className="flex items-center gap-4">
          {channels.length > 0 && (
            <div className="lg:hidden">
              <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/10">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-80 bg-card border-r border-white/5">
                  <SheetHeader className="p-6 border-b border-white/5">
                    <SheetTitle className="text-white flex items-center gap-2">
                      <List className="w-5 h-5 text-primary" /> Channel Browser
                    </SheetTitle>
                  </SheetHeader>
                  <div className="h-[calc(100%-80px)]">
                    <ChannelList
                      channels={channels}
                      onSelectChannel={handleChannelSelect}
                      selectedChannelId={selectedChannel?.id}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <Play className="w-6 h-6 text-white fill-current" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold tracking-tight text-white">StreamGlide</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Pro Edition</p>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-2xl px-8">
          <div className="relative group">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Paste M3U playlist URL..."
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              className="pl-11 pr-24 bg-white/5 border-white/10 h-11 text-sm rounded-full focus:ring-primary/50 transition-all"
              onKeyDown={(e) => e.key === 'Enter' && loadPlaylist(playlistUrl)}
            />
            <Button 
              onClick={() => loadPlaylist(playlistUrl)} 
              disabled={isLoading} 
              size="sm"
              className="absolute right-1.5 top-1.5 h-8 rounded-full px-6 shadow-md"
            >
              {isLoading ? "Loading..." : "Load"}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Badge variant="outline" className="hidden xl:flex bg-primary/10 border-primary/20 text-primary px-3 py-1">
            v2.0 Stable
          </Badge>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Main Cinema Area */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-black/40 relative">
          <div className="max-w-7xl mx-auto p-6 space-y-8">
            {/* Player Container */}
            <div className={`${selectedChannel ? 'aspect-video' : 'h-0'} transition-all duration-500 overflow-hidden`}>
              <StreamPlayer
                url={selectedChannel?.url || ''}
                title={selectedChannel?.name || 'No Channel Selected'}
              />
            </div>

            {/* Dashboard / Empty State */}
            {!selectedChannel && (
              <div className="space-y-12 py-12">
                {channels.length === 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    <div className="lg:col-span-7 space-y-6">
                      <h2 className="text-5xl md:text-6xl font-black text-white leading-tight">
                        Your Personal <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Streaming Universe.</span>
                      </h2>
                      <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                        The world's most advanced IPTV player. Stream thousands of HD channels from any M3U playlist with AI-powered categorization and lightning-fast performance.
                      </p>
                      <div className="flex flex-wrap gap-4 pt-4">
                        <Button size="lg" className="rounded-full px-8 h-14 text-lg" onClick={() => loadPlaylist('https://iptv-org.github.io/iptv/index.m3u')}>
                          Try Demo Playlist
                        </Button>
                        <Button variant="outline" size="lg" className="rounded-full px-8 h-14 text-lg border-white/10">
                          Learn More
                        </Button>
                      </div>
                    </div>
                    <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                      <div className="p-6 bg-card/50 border border-white/5 rounded-3xl space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                          <Zap className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-white">Fast Play</h3>
                        <p className="text-xs text-muted-foreground">Near-zero latency switching between HD streams.</p>
                      </div>
                      <div className="p-6 bg-card/50 border border-white/5 rounded-3xl space-y-4 translate-y-8">
                        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                          <Shield className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-white">Secure</h3>
                        <p className="text-xs text-muted-foreground">Privacy-focused streaming with no data tracking.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Section */}
                {savedPlaylists.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-primary" />
                        <h3 className="text-xl font-bold text-white">Continue Watching</h3>
                      </div>
                      <Button variant="link" className="text-primary hover:text-primary/80">View All</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {savedPlaylists.map(url => (
                        <div key={url} className="group relative bg-card border border-white/5 rounded-2xl p-5 hover:border-primary/40 transition-all cursor-pointer overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-destructive bg-black/50 backdrop-blur-md"
                              onClick={(e) => { e.stopPropagation(); removePlaylist(url); }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="space-y-3" onClick={() => loadPlaylist(url)}>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                <Globe className="w-5 h-5 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">Playlist Library</p>
                                <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter">{url}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-primary text-[10px] font-bold uppercase">
                              <Play className="w-3 h-3 fill-current" /> Load Source
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Features Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 border-t border-white/5">
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <Layout className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm mb-1">Global Reach</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">Access streams from over 150 countries instantly.</p>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
                  <List className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm mb-1">AI Smart List</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">Automatically organized and categorized for you.</p>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <ArrowRight className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm mb-1">HD Streaming</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">Optimized playback for 4K and Full HD content.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Pro Channel List */}
        {channels.length > 0 && (
          <aside className="hidden lg:flex w-96 border-l border-white/5 bg-card flex-col z-20 shadow-2xl shadow-black">
            <div className="p-6 flex items-center justify-between border-b border-white/5">
              <div>
                <h2 className="font-bold text-lg text-white">Channels</h2>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Live Directory</p>
              </div>
              <Badge variant="outline" className="bg-white/5 border-white/10 text-white font-mono">
                {channels.length}
              </Badge>
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