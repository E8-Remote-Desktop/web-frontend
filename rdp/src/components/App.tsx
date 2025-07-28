"use client";

import { useEffect, useRef } from "react";
import { startWebRTC } from "../lib/rtc";
import Player from "./player";
import Input from "./input";

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (videoRef.current && !startedRef.current) {
      startedRef.current = true;
      startWebRTC(videoRef.current);
    }
  }, []);

  return (
    <div className="relative w-full h-full">
      <Player videoRef={videoRef} />
      <Input />
    </div>
  );
}
