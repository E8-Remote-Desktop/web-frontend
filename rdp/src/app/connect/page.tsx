"use client";

import { Suspense } from "react";
import Connect from "./connect";

// Dynamically import the App (which includes WebRTC + Player + Input)

export default function RDPWrapper() {
  return (
    <Suspense fallback={<div>Loading remote session...</div>}>
      <Connect />
    </Suspense>
  );
}
