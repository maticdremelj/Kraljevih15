import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { createPeerConnection, createAnswer } from "../webrtcUtils";

const Join = () => {
  const pcRef = useRef(null);
  const dataChannelRef = useRef(null); // Reference for the data channel
  const navigate = useNavigate();
  const [gameId, setGameId] = useState("");
  const [error, setError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messageToSend, setMessageToSend] = useState(''); // State for message input
  const [receivedMessage, setReceivedMessage] = useState(''); // State to display received messages

  useEffect(() => {
    pcRef.current = createPeerConnection();
    const pc = pcRef.current;

    // Data Channel Handling for Joiner
    pc.ondatachannel = (event) => {
      const dataChannel = event.channel;
      dataChannelRef.current = dataChannel;
      console.log("Data Channel received by Joiner:", dataChannel.label);

      dataChannel.onopen = () => {
        console.log("Data Channel opened by Joiner!");
      };

      dataChannel.onmessage = (e) => {
        console.log("Joiner received message:", e.data);
        setReceivedMessage(e.data); // Update state to display received message
      };

      dataChannel.onclose = () => {
        console.log("Data Channel closed by Joiner!");
      };

      dataChannel.onerror = (err) => {
        console.error("Data Channel error on Joiner:", err);
      };
    };

    // ICE Candidate Handling
    pc.onicecandidate = async (event) => {
      if (event.candidate && gameId) {
        // Save ICE candidates to Firestore for the host to receive
        const gameRef = doc(db, "games", gameId);
        const snapshot = await db.collection('games').doc(gameId).get();
        const data = snapshot.data();
        await setDoc(gameRef, {
          iceCandidatesGuest: [...(data?.iceCandidatesGuest || []), event.candidate.toJSON()]
        }, { merge: true });
      }
    };

    return () => {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [gameId]); // Add gameId to dependencies to ensure ICE candidates are sent with a valid gameId

  const handleJoinGame = async () => {
    setError(null);
    setIsConnecting(true);
    const pc = pcRef.current;

    try {
      const gameRef = doc(db, "games", gameId);
      const gameSnap = await getDoc(gameRef);
      const gameData = gameSnap.data();

      if (!gameData || !gameData.offer) {
        setError("No offer found for this Game ID.");
        setIsConnecting(false);
        return;
      }

      console.log("Offer received from Firestore:", gameData.offer);
      await pc.setRemoteDescription(new RTCSessionDescription(gameData.offer));

      // Listen for ICE candidates from the host
      const unsubscribeCandidates = onSnapshot(gameRef, async (snapshot) => {
        const data = snapshot.data();
        if (data?.iceCandidatesHost) {
          for (const candidate of data.iceCandidatesHost) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.error("Error adding received ICE candidate", e);
            }
          }
        }
      });

      const answer = await createAnswer(pc);
      await setDoc(gameRef, { answer }, { merge: true });
      console.log("Answer sent to Firestore:", answer);

      // Connection established, navigate to the game board
      console.log("WebRTC Connection established!");
      navigate(`/board/${gameId}`);
      unsubscribeCandidates(); // Stop listening for candidates after connection
    } catch (err) {
      console.error("Failed to join game:", err);
      setError(`Failed to join game: ${err.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSendMessage = () => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      dataChannelRef.current.send(messageToSend);
      console.log("Joiner sent message:", messageToSend);
      setMessageToSend(''); // Clear input after sending
    } else {
      console.warn("Data Channel is not open. Cannot send message.");
    }
  };

  return (
    <div>
      <h1>Join Game</h1>
      <input
        type="text"
        placeholder="Enter Game ID"
        value={gameId}
        onChange={(e) => setGameId(e.target.value)}
        className="border-2 p-2"
      />
      <button
        onClick={handleJoinGame}
        disabled={isConnecting || !gameId}
        className="border-2 ml-2"
      >
        {isConnecting ? "Connecting..." : "Join Game"}
      </button>
      {error && <p className="text-red-500">{error}</p>}
      {receivedMessage && <p>Received: {receivedMessage}</p>}
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
      </div>
    </div>
  );
};

export default Join; 