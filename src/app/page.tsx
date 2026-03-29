"use client";

import React, { useState, useEffect } from 'react';
import { Plus, List, Play, History, Globe, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { parseM3U, IPTVChannel } from '@/lib/m3u-parser';
import StreamPlayer from '@/components/StreamPlayer';
import ChannelList from '@/components/ChannelList';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function StreamGlide() {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [channels, setChannels] = useState<IPTVChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<IPTVChannel | null>(null);
  const [savedPlaylists, setSavedPlaylists] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-card/30 backdrop-blur-xl z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Play className="w-5 h-5 text-primary-foreground fill-current" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">StreamGlide</h1>
        </div>

        <div className="flex-1 max-w-2xl px-8 flex gap-2">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Enter M3U Playlist URL..."
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              className="pl-9 bg-background/50 border-white/10 h-10"
              onKeyDown={(e) => e.key === 'Enter' && loadPlaylist(playlistUrl)}
            />
          </div>
          <Button onClick={() => loadPlaylist(playlistUrl)} disabled={isLoading} className="h-10">
            {isLoading ? "Loading..." : "Load"}
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <p className="text-xs font-medium text-white/50">Modern IPTV Streaming</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-br from-background to-card/20">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Player Section */}
            <div className="space-y-4">
              <StreamPlayer
                url={selectedChannel?.url || ''}
                title={selectedChannel?.name || 'No Channel Selected'}
              />
            </div>

            {/* Saved Playlists Section (Shown if no channels loaded) */}
            {channels.length === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10">
                <div className="bg-card/40 border border-white/5 p-8 rounded-2xl flex flex-col items-center text-center justify-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                    <Plus className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Getting Started</h2>
                  <p className="text-muted-foreground max-w-sm">
                    Enter a valid M3U playlist URL above to browse and stream thousands of worldwide TV channels instantly.
                  </p>
                  <Button variant="outline" className="mt-4" onClick={() => loadPlaylist('https://iptv-org.github.io/iptv/index.m3u')}>
                    Try Demo Playlist
                  </Button>
                </div>

                <div className="bg-card/40 border border-white/5 p-8 rounded-2xl">
                  <div className="flex items-center gap-2 mb-6">
                    <History className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-bold text-white">Recent Playlists</h3>
                  </div>
                  <div className="space-y-3">
                    {savedPlaylists.length === 0 ? (
                      <p className="text-muted-foreground italic py-8 text-center border border-dashed border-white/10 rounded-xl">
                        No recent playlists found
                      </p>
                    ) : (
                      savedPlaylists.map(url => (
                        <div key={url} className="group flex items-center gap-2 p-3 bg-background/50 border border-white/5 rounded-xl hover:border-primary/50 transition-all cursor-pointer">
                          <div className="flex-1 min-w-0" onClick={() => loadPlaylist(url)}>
                            <p className="text-sm font-medium text-white truncate">{url}</p>
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
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-10">
              <div className="p-4 rounded-xl bg-card/20 border border-white/5">
                <h4 className="font-semibold text-white flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-primary" /> Global Content
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Stream channels from across the globe in HD quality with low latency.</p>
              </div>
              <div className="p-4 rounded-xl bg-card/20 border border-white/5">
                <h4 className="font-semibold text-white flex items-center gap-2 mb-2">
                  <List className="w-4 h-4 text-primary" /> Smart Management
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Organize your favorite streams and playlists with ease and persistent storage.</p>
              </div>
              <div className="p-4 rounded-xl bg-card/20 border border-white/5">
                <h4 className="font-semibold text-white flex items-center gap-2 mb-2">
                  <ArrowRight className="w-4 h-4 text-primary" /> AI Powered
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Automatically categorize sparse playlists using advanced GenAI analysis.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Channel List */}
        {channels.length > 0 && (
          <aside className="w-[380px] border-l border-white/5 bg-card/20 backdrop-blur-xl flex flex-col z-10 transition-transform">
            <div className="p-4 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2">
                <List className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-white">Channels</h2>
              </div>
              <Badge variant="outline" className="bg-white/5 border-white/10 text-white/50">
                {channels.length}
              </Badge>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChannelList
                channels={channels}
                onSelectChannel={setSelectedChannel}
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
