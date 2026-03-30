"use client";

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StreamPlayerProps {
  url: string;
  title: string;
}

export default function StreamPlayer({ url, title }: StreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) {
      setError(null);
      setIsLoading(false);
      return;
    }

    let hls: Hls | null = null;
    setError(null);
    setIsLoading(true);

    const playVideo = () => {
      video.play().then(() => {
        setIsPlaying(true);
        setIsLoading(false);
      }).catch((e) => {
        setIsPlaying(false);
        setIsLoading(false);
      });
    };

    const isHlsUrl = url.toLowerCase().includes('.m3u8') || url.toLowerCase().includes('type=m3u8');

    if (Hls.isSupported() && isHlsUrl) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      
      hls.loadSource(url);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        playVideo();
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError("Source offline or blocked.");
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls?.recoverMediaError();
              break;
            default:
              setError("Playback error.");
              hls?.destroy();
              break;
          }
          setIsLoading(false);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', playVideo);
      video.addEventListener('error', () => {
        setError("Playback failed.");
        setIsLoading(false);
      });
    } else {
      video.src = url;
      video.addEventListener('loadedmetadata', playVideo);
      video.addEventListener('error', () => {
        setError("Format not supported.");
        setIsLoading(false);
      });
    }

    return () => {
      if (hls) hls.destroy();
      if (video) {
        video.pause();
        video.src = "";
        video.load();
      }
    };
  }, [url]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => setIsPlaying(true));
      }
    }
  };

  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      videoRef.current.muted = newMuted;
    }
  };

  const toggleFullScreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative group w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/5 flex items-center justify-center"
      style={{ cursor: showControls ? 'default' : 'none' }}
    >
      {!url && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/40 gap-4">
          <Play className="w-20 h-20 opacity-20" />
          <p className="font-medium text-lg tracking-tight">Select a channel to stream</p>
        </div>
      )}
      
      {url && (
        <>
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            playsInline
            crossOrigin="anonymous"
            onClick={togglePlay}
          />

          {/* Loading Overlay */}
          {isLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px] z-10">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
          )}

          {/* Error Overlay */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-6 z-20">
              <div className="max-w-xs w-full text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
                <p className="text-sm font-medium text-white">{error}</p>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="w-full">
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* Controls Overlay */}
          <div className={cn(
            "absolute inset-0 z-30 flex flex-col justify-between p-4 transition-opacity duration-500",
            showControls ? "opacity-100" : "opacity-0"
          )}>
            {/* Top Bar */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-white font-bold text-lg drop-shadow-md">{title}</h3>
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-600 hover:bg-red-700 text-white text-[10px] h-5 px-1.5 border-none animate-pulse">
                    LIVE
                  </Badge>
                  <span className="text-[10px] text-white/60 font-medium tracking-widest uppercase">
                    1080p • HLS
                  </span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleFullScreen}
                className="text-white hover:bg-white/10 h-10 w-10"
              >
                <Maximize className="w-5 h-5" />
              </Button>
            </div>

            {/* Bottom Bar */}
            <div className="flex items-center justify-between gap-6 bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={togglePlay} 
                  className="text-white hover:bg-white/10 h-10 w-10 rounded-full"
                >
                  {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                </Button>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleMute} 
                    className="text-white hover:bg-white/10 h-9 w-9"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                    className="w-24 hidden sm:flex"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">Status</span>
                  <span className="text-xs text-green-400 font-medium">Optimal</span>
                </div>
                <div className="w-px h-8 bg-white/10 hidden md:block" />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white/60 hover:text-white hover:bg-white/10"
                  onClick={() => window.location.reload()}
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}