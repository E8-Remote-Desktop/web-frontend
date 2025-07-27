"use client";

import dynamic from "next/dynamic";

// Dynamically import the App (which includes WebRTC + Player + Input)
const App = dynamic(() => import("../components/App"), { ssr: false });

export default function Page() {
  return <App />;
}
