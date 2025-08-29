function generateRandomString(length: number): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

function bindPeerConnectionHandlers(
  pc: RTCPeerConnection,
  remoteStream: MediaStream,
  conn: WebSocket,
  my_id: string,
  id: string
) {
  pc.ontrack = (event) => {
    console.log("Recieved Media Track:", event.streams[0]);
    remoteStream.addTrack(event.track);

    // Start polling WebRTC stats every 5 seconds
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      conn.send(
        JSON.stringify({
          From: my_id,
          To: id,
          content: { type: "ice", candidate: event.candidate },
        })
      );
    }
  };
  // Bind status thingy
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

  return pc.createDataChannel("input");
}

export async function startWebRTC(video: HTMLVideoElement, id: string) {
  const my_id = generateRandomString(12);
  const conn = new WebSocket(
    `wss://${process.env.NEXT_PUBLIC_SOCKET_URL}/ws?id=${my_id}&type=client`
  );

  const pendingCandidates: RTCIceCandidateInit[] = [];
  let remoteDescriptionSet = false;
  const remoteStream = new MediaStream();
  // Temp peer connection until the first msgs through web socket come through
  let pc: RTCPeerConnection;
  let dataChannel: RTCDataChannel;

  let resolveSetup: () => void;

  const setupComplete = new Promise<void>((resolve) => {
    resolveSetup = resolve;
  });

  conn.onmessage = async (message) => {
    const msg = JSON.parse(message.data);
    console.log(msg);
    if ("turnCredentials" in msg.content && !pc) {
      pc = new RTCPeerConnection({
        iceServers: [
          {
            urls: msg.content.turnCredentials.urls,
            username: msg.content.turnCredentials.username,
            credential: msg.content.turnCredentials.password,
          },
          {
            urls: "stun:stun.l.google.com:19302",
          },
        ],
      });
      pc.addTransceiver("audio", { direction: "recvonly" });
      pc.addTransceiver("video", { direction: "recvonly" });
      dataChannel = bindPeerConnectionHandlers(
        pc,
        remoteStream,
        conn,
        my_id,
        id
      );
      resolveSetup();

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      conn.send(
        JSON.stringify({
          From: my_id,
          To: id,
          content: { type: "offer", sdp: offer.sdp },
        })
      );
      console.log("Sent SDP offer", offer.sdp);
    }
    if (msg.content.type === "answer") {
      if (remoteDescriptionSet) {
        console.warn("Ignoring duplicate answer");
        return;
      }

      await pc.setRemoteDescription(
        new RTCSessionDescription({ type: "answer", sdp: msg.content.sdp })
      );
      remoteDescriptionSet = true;

      // Process any queued ICE candidates
      for (const candidate of pendingCandidates) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidates.length = 0;
    } else if (msg.content.type === "ice" && msg.content.candidate) {
      if (remoteDescriptionSet) {
        await pc.addIceCandidate(new RTCIceCandidate(msg.content.candidate));
      } else {
        pendingCandidates.push(msg.content.candidate);
      }
    }
  };

  video.srcObject = remoteStream;

  await setupComplete;

  console.log("Ready to send SDP OFFER!");
  // There should be no way it can be unassigned
  return { pc: pc!, dataChannel: dataChannel! };
}
