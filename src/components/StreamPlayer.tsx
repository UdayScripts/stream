"use client";

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface StreamPlayerProps {
  url: string;
  title: string;
}

export default function StreamPlayer({ url, title }: StreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
        console.error("Playback failed:", e);
        setIsPlaying(false);
        setIsLoading(false);
      });
    };

    // Robust HLS detection
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
              setError("Network error: The stream source might be offline or blocked.");
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError("Media error: Trying to recover...");
              hls?.recoverMediaError();
              break;
            default:
              setError("An unrecoverable playback error occurred.");
              hls?.destroy();
              break;
          }
          setIsLoading(false);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = url;
      video.addEventListener('loadedmetadata', playVideo);
      video.addEventListener('error', () => {
        setError("Playback failed. The stream might be offline or restricted.");
        setIsLoading(false);
      });
    } else {
      // Regular video source (MP4, etc.)
      video.src = url;
      video.addEventListener('loadedmetadata', playVideo);
      video.addEventListener('error', () => {
        setError("Playback failed. This format might not be supported in your browser.");
        setIsLoading(false);
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
      if (video) {
        video.pause();
        video.src = "";
        video.load();
      }
    };
  }, [url]);

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
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div className="relative group w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/5 flex items-center justify-center">
      {!url && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground flex-col gap-4">
          <Play className="w-16 h-16 opacity-20" />
          <p className="font-medium text-lg">Select a channel to start streaming</p>
          <p className="text-sm opacity-50">Supports HLS (.m3u8) and MP4 streams</p>
        </div>
      )}
      
      {url && (
        <>
          <video
            ref={videoRef}
            className="w-full h-full cursor-pointer"
            playsInline
            crossOrigin="anonymous"
            onClick={togglePlay}
          />

          {isLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm font-medium text-white">Loading stream...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 z-20">
              <div className="max-w-md w-full space-y-4 text-center">
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive text-left">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Playback Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <div className="flex flex-col gap-3 items-center">
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="gap-2">
                    <RotateCcw className="w-4 h-4" /> Refresh Page
                  </Button>
                  <p className="text-[10px] text-muted-foreground opacity-70">
                    Note: Some streams may be blocked due to browser security (HTTP content on HTTPS) or CORS restrictions.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={togglePlay} className="text-white hover:bg-white/10 h-9 w-9">
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                </Button>
                
                <div className="flex items-center gap-2 min-w-[120px]">
                  <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-white/10 h-9 w-9">
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                    className="w-24"
                  />
                </div>
                
                <div className="ml-4 max-w-[200px] md:max-w-[400px]">
                  <p className="text-sm font-semibold text-white truncate">{title}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] bg-white/5 border-white/10 hidden sm:flex text-primary">
                  LIVE
                </Badge>
                <Button variant="ghost" size="icon" onClick={toggleFullScreen} className="text-white hover:bg-white/10 h-9 w-9">
                  <Maximize className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
