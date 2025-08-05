"use client";

import { useRef, useEffect, useCallback, RefObject } from "react";

interface InputProps {
  dataChannel: RTCDataChannel | null;
  videoRef: RefObject<HTMLVideoElement | null>;
}

// Linux-compatible keycode mapping (from linux/input-event-codes.h)
const KeyMap: Record<string, number> = {
  Escape: 1,
  Digit1: 2,
  Digit2: 3,
  Digit3: 4,
  Digit4: 5,
  Digit5: 6,
  Digit6: 7,
  Digit7: 8,
  Digit8: 9,
  Digit9: 10,
  Digit0: 11,
  Minus: 12,
  Equal: 13,
  Backspace: 14,
  Tab: 15,
  KeyQ: 16,
  KeyW: 17,
  KeyE: 18,
  KeyR: 19,
  KeyT: 20,
  KeyY: 21,
  KeyU: 22,
  KeyI: 23,
  KeyO: 24,
  KeyP: 25,
  BracketLeft: 26,
  BracketRight: 27,
  Enter: 28,
  ControlLeft: 29,
  KeyA: 30,
  KeyS: 31,
  KeyD: 32,
  KeyF: 33,
  KeyG: 34,
  KeyH: 35,
  KeyJ: 36,
  KeyK: 37,
  KeyL: 38,
  Semicolon: 39,
  Quote: 40,
  Backquote: 41,
  ShiftLeft: 42,
  Backslash: 43,
  KeyZ: 44,
  KeyX: 45,
  KeyC: 46,
  KeyV: 47,
  KeyB: 48,
  KeyN: 49,
  KeyM: 50,
  Comma: 51,
  Period: 52,
  Slash: 53,
  ShiftRight: 54,
  AltLeft: 56,
  Space: 57,
  CapsLock: 58,
  F1: 59,
  F2: 60,
  F3: 61,
  F4: 62,
  F5: 63,
  F6: 64,
  F7: 65,
  F8: 66,
  F9: 67,
  F10: 68,
  F11: 87,
  F12: 88,
  ArrowUp: 103,
  ArrowLeft: 105,
  ArrowRight: 106,
  ArrowDown: 108,
  MetaLeft: 125,
  AltRight: 100,
  ControlRight: 97,
  Delete: 111,
};

export default function Input({ dataChannel, videoRef }: InputProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleUnmute = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = false;
    try {
      await video.play();
      console.log("Unmuted Video");
      console.log(video.volume);
    } catch (err) {
      console.error("Error unmuting video: ", err);
    }
  }, [videoRef]);

  const sendBuffer = useCallback(
    (buffer: ArrayBuffer) => {
      if (dataChannel && dataChannel.readyState === "open") {
        try {
          dataChannel.send(buffer);
        } catch (e) {
          console.error("Failed to send message", e);
        }
      }
    },
    [dataChannel]
  );
  const handleKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const keyCode = KeyMap[e.code];
    if (keyCode === undefined) {
      console.warn("Unknown key:", e.code);
      return;
    }

    let modifiers = 0;
    if (e.ctrlKey) modifiers |= 1 << 0;
    if (e.shiftKey) modifiers |= 1 << 1;
    if (e.altKey) modifiers |= 1 << 2;
    if (e.metaKey) modifiers |= 1 << 3;

    const buffer = new ArrayBuffer(5);
    const view = new DataView(buffer);
    view.setUint8(0, 1); // event type: keyboard
    view.setUint16(1, keyCode);
    view.setUint8(3, modifiers);
    view.setUint8(4, 0); // keyUp

    sendBuffer(buffer);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const blockedShortcuts = new Set([
      "KeyS",
      "KeyP",
      "KeyO",
      "KeyA",
      "KeyF",
      "KeyZ",
      "KeyY",
    ]);

    const metaKey = e.ctrlKey || e.metaKey;

    if (metaKey && blockedShortcuts.has(e.code)) {
      e.preventDefault();
      e.stopPropagation();
      console.log(`Blocked shortcut: ${metaKey ? "Ctrl/Cmd" : ""}+${e.code}`);
    }

    // Special case: Warn on Ctrl+W (but can't block)
    if (metaKey && e.code === "KeyW") {
      console.warn("Cannot prevent Ctrl+W — tab may close.");
    }

    // Send key event as usual
    const keyCode = KeyMap[e.code];
    if (keyCode === undefined) {
      console.warn("Unknown key:", e.code);
      return;
    }

    let modifiers = 0;
    if (e.ctrlKey) modifiers |= 1 << 0;
    if (e.shiftKey) modifiers |= 1 << 1;
    if (e.altKey) modifiers |= 1 << 2;
    if (e.metaKey) modifiers |= 1 << 3;

    const buffer = new ArrayBuffer(5);
    const view = new DataView(buffer);
    view.setUint8(0, 1); // event type: keyboard
    view.setUint16(1, keyCode);
    view.setUint8(3, modifiers);
    view.setUint8(4, 1);

    sendBuffer(buffer);
  };

  const handleClick = () => {
    handleUnmute();
    containerRef.current?.requestPointerLock();
  };
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ""; // Show "Leave site?" prompt
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== containerRef.current) return;

      const buffer = new ArrayBuffer(6);
      const view = new DataView(buffer);
      view.setUint8(0, 2); // event type: mouse move
      view.setUint8(1, e.buttons); // mouse button bitmask //deprecated
      view.setInt16(2, e.movementX); // relative X
      view.setInt16(4, e.movementY); // relative Y

      sendBuffer(buffer);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (document.pointerLockElement !== containerRef.current) return;

      const buffer = new ArrayBuffer(3);
      const view = new DataView(buffer);
      view.setUint8(0, 3); // event type: mouse button event
      view.setUint8(1, e.button); // which button (0 left, 1 middle, 2 right)
      view.setUint8(2, 1); // 1 = button down
      sendBuffer(buffer);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (document.pointerLockElement !== containerRef.current) return;

      const buffer = new ArrayBuffer(3);
      const view = new DataView(buffer);
      view.setUint8(0, 3); // event type: mouse button event
      view.setUint8(1, e.button);
      view.setUint8(2, 0); // 0 = button up
      sendBuffer(buffer);
    };

    const handlePointerLockChange = () => {
      const isLocked = document.pointerLockElement === containerRef.current;
      console.log("Pointer lock", isLocked ? "enabled" : "disabled");
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("pointerlockchange", handlePointerLockChange);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener(
        "pointerlockchange",
        handlePointerLockChange
      );
    };
  }, [sendBuffer]);
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);
      view.setUint8(0, 4); // event type: scroll
      view.setInt16(1, Math.max(-1, Math.min(1, Math.round(e.deltaY / 100)))); // scroll delta Y (signed)
      // you can add deltaX if you want, but your server only expects Y for now

      sendBuffer(buffer);
    };

    const element = containerRef.current;
    element?.addEventListener("wheel", handleWheel);

    return () => {
      element?.removeEventListener("wheel", handleWheel);
    };
  }, [sendBuffer]);
  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-10"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      style={{ outline: "none", cursor: "crosshair" }}
    />
  );
}
