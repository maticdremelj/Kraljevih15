// webrtcUtils.js
export const createPeerConnection = () => {
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  });

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("New ICE Candidate:", event.candidate);
      // Send this candidate to the other peer via Firebase or another signaling method
    }
  };

  return pc;
};

export const createOffer = async (pc) => {
  if (!pc || pc.signalingState === "closed") {
    console.error("Error: PeerConnection is closed or undefined.");
    return;
  }

  try {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log("Offer Created:", offer);
    return offer; // Send this to the remote peer via Firebase
  } catch (error) {
    console.error("Error creating offer:", error);
  }
};

export const createAnswer = async (pc) => {
  try {
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    console.log("Answer Created:", answer);
    return answer;
  } catch (error) {
    console.error("Failed to create answer:", error);
    throw error;
  }
};