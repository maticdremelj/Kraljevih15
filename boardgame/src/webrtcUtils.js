// Function to create and configure a new RTCPeerConnection
export const createPeerConnection = () => {
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun.l.google.com:5349" } 
    ],
  });

  // Event listener for new ICE candidates
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("New ICE Candidate:", event.candidate);
    }
  };

  return pc; // Return the created peer connection
};

// Function to create an offer (for initiating a WebRTC connection)
export const createOffer = async (pc) => {
  if (!pc || pc.signalingState === "closed") {
    console.error("Error: PeerConnection is closed or undefined.");
    return;
  }

  try {
    // Create an SDP offer
    const offer = await pc.createOffer();
    
    // Set the local description with the created offer
    await pc.setLocalDescription(offer);
    
    console.log("Offer Created:", offer);
    
    return offer; 
  } catch (error) {
    console.error("Error creating offer:", error);
  }
};

// Function to create an answer (for responding to an offer)
export const createAnswer = async (pc) => {
  try {
    // Create an SDP answer in response to an offer
    const answer = await pc.createAnswer();
    
    // Set the local description with the created answer
    await pc.setLocalDescription(answer);
    
    console.log("Answer Created:", answer);
    
    return answer; 
  } catch (error) {
    console.error("Failed to create answer:", error);
    throw error;
  }
};