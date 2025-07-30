export async function startWebRTC(video: HTMLVideoElement) {
  const conn = new WebSocket("wss://not2.projecteclipse.org");

  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  const pendingCandidates: RTCIceCandidateInit[] = [];
  let remoteDescriptionSet = false;
  const remoteStream = new MediaStream();
  video.srcObject = remoteStream;

  pc.ontrack = (event) => {
    console.log("Recieved Media Track:", event.streams[0]);
    remoteStream.addTrack(event.track);

    // Start polling WebRTC stats every 5 seconds
    setInterval(async () => {
      const stats = await pc.getStats();

      stats.forEach((report) => {
        if (report.type === "inbound-rtp" && report.kind === "audio") {
          console.log(`[Audio Stats]
  Packets Received: ${report.packetsReceived}
  Packets Lost:     ${report.packetsLost}
  Jitter:           ${report.jitter}`);
        }
        if (report.type === "inbound-rtp" && report.kind === "video") {
          const packetsLost = report.packetsLost ?? 0;
          const packetsReceived = report.packetsReceived ?? 0;
          const jitter = report.jitter ?? 0;
          const bytesReceived = report.bytesReceived ?? 0;

          console.log(`[Video Stats]
Packets Received: ${packetsReceived}
Packets Lost:     ${packetsLost}
Jitter:           ${jitter}
Bytes Received:   ${bytesReceived}`);
        }

        if (report.type === "track" && report.kind === "video") {
          console.log(`[Video Track]
  Frames Decoded:     ${report.framesDecoded}
  Frames Dropped:     ${report.framesDropped}
  Frame Width/Height: ${report.frameWidth}x${report.frameHeight}`);
        }
      });
    }, 5000);
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      conn.send(JSON.stringify({ type: "ice", candidate: event.candidate }));
    }
  };

  const dataChannel = pc.createDataChannel("input");

  conn.onmessage = async (message) => {
    const msg = JSON.parse(message.data);

    if (msg.type === "answer") {
      if (remoteDescriptionSet) {
        console.warn("Ignoring duplicate answer");
        return;
      }

      await pc.setRemoteDescription(
        new RTCSessionDescription({ type: "answer", sdp: msg.sdp })
      );
      remoteDescriptionSet = true;

      // Process any queued ICE candidates
      for (const candidate of pendingCandidates) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidates.length = 0;
    } else if (msg.type === "ice" && msg.candidate) {
      if (remoteDescriptionSet) {
        await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
      } else {
        pendingCandidates.push(msg.candidate);
      }
    }
  };

  await new Promise<void>((resolve) => {
    conn.onopen = () => resolve();
  });

  pc.addTransceiver("audio", { direction: "recvonly" });
  pc.addTransceiver("video", { direction: "recvonly" });

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  console.log("Ready to send SDP OFFER!");

  conn.send(JSON.stringify({ type: "offer", sdp: offer.sdp }));
  console.log("Sent SDP offer", offer.sdp);

  return { pc, dataChannel };
}
