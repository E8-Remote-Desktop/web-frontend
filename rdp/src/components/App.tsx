"use client";
import { useEffect, useRef, useState } from "react";
import { startWebRTC } from "../lib/rtc";
import Player from "./player";
import Input from "./input";

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const startedRef = useRef(false);

  // Store dataChannel in state (or a ref if you want)
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);

  useEffect(() => {
    if (videoRef.current && !startedRef.current) {
      startedRef.current = true;

      // Call startWebRTC and get the dataChannel
      startWebRTC(videoRef.current).then(({ dataChannel }) => {
        setDataChannel(dataChannel);
      });
    }
  }, []);

  return (
    <div className="relative w-full h-full">
      <Player videoRef={videoRef} />
      {/* Pass dataChannel to Input */}
      <Input dataChannel={dataChannel} videoRef={videoRef} />
    </div>
  );
}
