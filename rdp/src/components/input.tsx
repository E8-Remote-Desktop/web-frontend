"use client";

export default function Input() {
  return (
    <div
      className="absolute inset-0 z-10"
      tabIndex={0}
      onKeyDown={(e) => {
        console.log("Key pressed:", e.key);
        // send key over data channel
      }}
      onMouseMove={(e) => {
        console.log("Mouse moved:", e.clientX, e.clientY);
        // send mouse event over data channel
      }}
    />
  );
}
