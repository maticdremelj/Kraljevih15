import { useEffect, useRef, useState } from "react";
import { db } from "../firebaseConfig"; // ✅ Import Firestore instance
import { doc, getDoc, setDoc } from "firebase/firestore";
import { createPeerConnection, createAnswer } from "../webrtcUtils";

const Join = () => {
  const pcRef = useRef(null);
  const [gameId, setGameId] = useState("");
  const [error, setError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    pcRef.current = createPeerConnection();

    return () => {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, []);

  const handleJoinGame = async () => {
    setError(null);
    setIsConnecting(true);

    const pc = pcRef.current;
    if (!pc || pc.signalingState === "closed") {
      setError("PeerConnection is closed or not initialized.");
      setIsConnecting(false);
      return;
    }

    try {
      const gameRef = doc(db, "games", gameId);
      const gameSnapshot = await getDoc(gameRef);

      if (!gameSnapshot.exists()) {
        setError("Game ID not found.");
        setIsConnecting(false);
        return;
      }

      const gameData = gameSnapshot.data();
      if (!gameData.offer) {
        setError("No offer found for this Game ID.");
        setIsConnecting(false);
        return;
      }

      console.log("Offer received from Firestore:", gameData.offer);

      // ✅ Set remote description (the host's offer)
      await pc.setRemoteDescription(new RTCSessionDescription(gameData.offer));

      // ✅ Create an answer
      const answer = await createAnswer(pc);

      // ✅ Save the answer to Firestore
      await setDoc(gameRef, { answer }, { merge: true });

      console.log("Answer created and sent to Firestore:", answer);
      setConnected(true);
    } catch (err) {
      console.error("Failed to join game:", err);
      setError(`Failed to join game: ${err.message}`);
    } finally {
      setIsConnecting(false);
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
        disabled={isConnecting || connected || !gameId}
        className="border-2 ml-2"
      >
        {isConnecting ? "Connecting..." : "Join Game"}
      </button>

      {error && <p className="text-red-500">{error}</p>}
      {connected && <p className="text-green-500">Connected to Host!</p>}
    </div>
  );
};

export default Join;