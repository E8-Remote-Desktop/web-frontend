export async function startWebRTC(video: HTMLVideoElement) {
  const conn = new WebSocket("ws://localhost:8080");

  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  pc.ontrack = (event) => {
    if (video.srcObject !== event.streams[0]) {
      video.srcObject = event.streams[0];
    }
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
      await pc.setRemoteDescription(
        new RTCSessionDescription({ type: "answer", sdp: msg.sdp })
      );
    } else if (msg.type === "ice" && msg.candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
    }
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  conn.onopen = () => {
    conn.send(JSON.stringify({ type: "offer", sdp: offer.sdp }));
  };

  return { pc, dataChannel };
}
