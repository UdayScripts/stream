"use client";

import React, { useState, useEffect } from 'react';
import { List, Play, History, Globe, Trash2, Menu, Tv } from 'lucide-react';
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
      setChannels(parsedChannels);
      savePlaylist(url);
      setPlaylistUrl(url);
      toast({
        title: "Success",
        description: `Loaded ${parsedChannels.length} channels.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid playlist URL or network error.",
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
      <header className="h-16 flex items-center justify-between px-4 border-b bg-card/50 backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          {channels.length > 0 && (
            <div className="lg:hidden">
              <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72">
                  <ChannelList
                    channels={channels}
                    onSelectChannel={handleChannelSelect}
                    selectedChannelId={selectedChannel?.id}
                  />
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
          <div className="relative">
            <Input
              placeholder="Enter M3U URL..."
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              className="h-9 text-sm bg-muted/50"
              onKeyDown={(e) => e.key === 'Enter' && loadPlaylist(playlistUrl)}
            />
            <Button 
              onClick={() => loadPlaylist(playlistUrl)} 
              disabled={isLoading} 
              size="sm"
              className="absolute right-1 top-1 h-7"
            >
              {isLoading ? "..." : "Load"}
            </Button>
          </div>
        </div>

        <div className="hidden sm:block">
          <Badge variant="secondary">v2.1</Badge>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {selectedChannel ? (
              <div className="space-y-4">
                <StreamPlayer
                  url={selectedChannel.url}
                  title={selectedChannel.name}
                />
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">{selectedChannel.name}</h2>
                  <Badge variant="outline">{selectedChannel.category}</Badge>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                  <Tv className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Welcome to StreamGlide</h2>
                  <p className="text-muted-foreground max-w-sm">Enter an M3U playlist URL above to start streaming your favorite channels.</p>
                </div>
                {savedPlaylists.length === 0 && (
                  <Button variant="outline" onClick={() => loadPlaylist('https://iptv-org.github.io/iptv/index.m3u')}>
                    Try Demo Playlist
                  </Button>
                )}
              </div>
            )}

            {!selectedChannel && savedPlaylists.length > 0 && (
              <div className="pt-8 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold">Recent Playlists</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedPlaylists.map(url => (
                    <div key={url} className="group flex items-center justify-between p-3 rounded-lg border bg-card hover:border-primary/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => loadPlaylist(url)}>
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm truncate font-medium">{url}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removePlaylist(url)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {channels.length > 0 && (
          <aside className="hidden lg:flex w-80 border-l bg-card flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <span className="font-bold">Channels</span>
              <Badge variant="secondary">{channels.length}</Badge>
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
