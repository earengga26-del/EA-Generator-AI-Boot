import React, { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  videoUrl: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        // When the url changes, load the new video
        if (videoRef.current) {
            videoRef.current.load();
        }
    }, [videoUrl]);

  return (
    <div className="aspect-video bg-black rounded-md overflow-hidden">
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        className="w-full h-full object-contain"
        autoPlay
        muted
        loop
      />
    </div>
  );
};

export default VideoPlayer;
