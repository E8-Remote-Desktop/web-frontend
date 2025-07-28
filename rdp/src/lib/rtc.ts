export async function startWebRTC(video: HTMLVideoElement) {
  const conn = new WebSocket("ws://192.168.1.231:8080");

  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  const pendingCandidates: RTCIceCandidateInit[] = [];
  let remoteDescriptionSet = false;

  pc.ontrack = (event) => {
    console.log("Recieved Media Track:", event.streams[0]);
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
