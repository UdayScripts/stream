"use client";

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface StreamPlayerProps {
  url: string;
  title: string;
}

export default function StreamPlayer({ url, title }: StreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHls, setIsHls] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    let hls: Hls;

    if (Hls.isSupported() && url.includes('.m3u8')) {
      hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      setIsHls(true);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoaded(true);
        video.play().catch(() => setIsPlaying(false));
        setIsPlaying(true);
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      setIsHls(true);
      video.addEventListener('loadedmetadata', () => {
        setIsLoaded(true);
        video.play().catch(() => setIsPlaying(false));
        setIsPlaying(true);
      });
    } else {
      video.src = url;
      setIsHls(false);
      video.addEventListener('loadedmetadata', () => {
        setIsLoaded(true);
        video.play().catch(() => setIsPlaying(false));
        setIsPlaying(true);
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [url]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
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
    <div className="relative group w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/5">
      {!url && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground flex-col gap-4">
          <Play className="w-16 h-16 opacity-20" />
          <p className="font-medium">Select a channel to start streaming</p>
        </div>
      )}
      
      <video
        ref={videoRef}
        className="w-full h-full"
        playsInline
      />

      {url && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={togglePlay} className="text-white hover:bg-white/10">
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              </Button>
              
              <div className="flex items-center gap-2 min-w-[120px]">
                <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-white/10">
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
              
              <div className="ml-4">
                <p className="text-sm font-medium text-white line-clamp-1">{title}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleFullScreen} className="text-white hover:bg-white/10">
                <Maximize className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
