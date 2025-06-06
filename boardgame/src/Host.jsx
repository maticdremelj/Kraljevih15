import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig";
import { doc, setDoc, onSnapshot, getDoc } from "firebase/firestore"; // Added getDoc
import { createPeerConnection, createOffer } from "../webrtcUtils";

const Host = () => {
  const pcRef = useRef(null);
  const dataChannelRef = useRef(null);
  const navigate = useNavigate();
  const [offer, setOffer] = useState(null);
  const [gameId, setGameId] = useState(null);
  const gameIdRef = useRef(null); // New ref for gameId
  const [isCreatingOffer, setIsCreatingOffer] = useState(false);
  const [error, setError] = useState(null);
  const [messageToSend, setMessageToSend] = useState('');
  const [receivedMessage, setReceivedMessage] = useState('');

  useEffect(() => {
    pcRef.current = createPeerConnection();

    const dataChannel = pcRef.current.createDataChannel("game_state");
    dataChannelRef.current = dataChannel;

    dataChannel.onopen = () => {
      console.log("Data Channel opened by Host!");
    };

    dataChannel.onmessage = (event) => {
      console.log("Host received message:", event.data);
      setReceivedMessage(event.data);
    };

    dataChannel.onclose = () => {
      console.log("Data Channel closed by Host!");
    };

    dataChannel.onerror = (err) => {
      console.error("Data Channel error on Host:", err);
    };

    // ICE Candidate Handling: Use gameIdRef.current for the latest gameId
    pcRef.current.onicecandidate = async (event) => {
      if (event.candidate && gameIdRef.current) {
        const gameRef = doc(db, "games", gameIdRef.current);
        const existingGameData = await getDoc(gameRef); // Fetch existing data
        const currentCandidates = existingGameData.exists()
          ? (existingGameData.data().iceCandidatesHost || [])
          : [];

        await setDoc(gameRef, {
          iceCandidatesHost: [...currentCandidates, event.candidate.toJSON()]
        }, { merge: true });
      }
    };

    return () => {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, []); // No gameId in dependencies here, as we use gameIdRef

  const handleCreateGame = async () => {
    setError(null);
    setIsCreatingOffer(true);
    const pc = pcRef.current;

    try {
      const newGameId = Math.random().toString(36).substring(2, 9);
      setGameId(newGameId);
      gameIdRef.current = newGameId; // Update the ref immediately

      const newOffer = await createOffer(pc);
      setOffer(newOffer);

      const gameRef = doc(db, "games", newGameId);

      await setDoc(gameRef, { offer: newOffer });
      console.log("Offer saved to Firestore:", newOffer);

      // Listen for an answer and guest ICE candidates from Firestore
      const unsubscribe = onSnapshot(gameRef, async (snapshot) => {
        const data = snapshot.data();
        if (data?.answer && pc.signalingState !== "closed") {
          console.log("Answer received from Firestore:", data.answer);
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));

          // Process guest ICE candidates as they arrive
          if (data.iceCandidatesGuest) {
            for (const candidate of data.iceCandidatesGuest) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (e) {
                console.error("Error adding received ICE candidate (Host):", e);
              }
            }
          }

          console.log("WebRTC Connection established!");
          navigate(`/board/${newGameId}`);
          unsubscribe(); // Stop listening for updates after connection
        }
      });

    } catch (err) {
      console.error("Failed to create offer:", err);
      setError(`Failed to create offer: ${err.message}`);
    } finally {
      setIsCreatingOffer(false);
    }
  };

  const handleSendMessage = () => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      dataChannelRef.current.send(messageToSend);
      console.log("Host sent message:", messageToSend);
      setMessageToSend('');
    } else {
      console.warn("Data Channel is not open. Cannot send message.");
    }
  };

  return (
    <div>
      <h1>Host Game</h1>
      <button
        onClick={handleCreateGame}
        disabled={isCreatingOffer || !!offer}
        className="border-2"
      >
        {isCreatingOffer ? "Creating..." : "Create Game"}
      </button>
      {error && <p className="text-red-500">{error}</p>}
      {offer && (
        <div>
          <p>Game ID: <strong>{gameId}</strong></p>
          <p>Share this ID with your opponent.</p>
          <div className="mt-4">
            <input
              type="text"
              placeholder="Message to send"
              value={messageToSend}
              onChange={(e) => setMessageToSend(e.target.value)}
              className="border-2 p-2 mr-2"
            />
            <button onClick={handleSendMessage} className="border-2">
              Send Test Message
            </button>
            {receivedMessage && <p>Received: {receivedMessage}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Host;