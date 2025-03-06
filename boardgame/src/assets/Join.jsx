import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Import for navigation
import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { createPeerConnection, createAnswer } from "../webrtcUtils";

const Join = () => {
  const pcRef = useRef(null);
  const navigate = useNavigate(); // ✅ Hook for navigation
  const [gameId, setGameId] = useState("");
  const [error, setError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

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
      await pc.setRemoteDescription(new RTCSessionDescription(gameData.offer));

      const answer = await createAnswer(pc);
      await setDoc(gameRef, { answer }, { merge: true });

      console.log("Answer sent to Firestore:", answer);
      navigate(`/board/${gameId}`); // ✅ Move to Board

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
        disabled={isConnecting || !gameId}
        className="border-2 ml-2"
      >
        {isConnecting ? "Connecting..." : "Join Game"}
      </button>

      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
};

export default Join;
