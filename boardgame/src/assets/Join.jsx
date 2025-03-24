import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { createPeerConnection, createAnswer } from "../webrtcUtils";

const Join = () => {
  // Reference to store the WebRTC peer connection instance
  const pcRef = useRef(null);

  // Hook to enable navigation between routes
  const navigate = useNavigate();

  // State to store the game ID entered by the user
  const [gameId, setGameId] = useState("");

  // State to handle error messages
  const [error, setError] = useState(null);

  // State to track whether the connection process is in progress
  const [isConnecting, setIsConnecting] = useState(false);

  // useEffect hook to initialize the PeerConnection when the component mounts
  useEffect(() => {
    // Create a new WebRTC PeerConnection and store it in the ref
    pcRef.current = createPeerConnection();

    // Cleanup function to close the connection when the component unmounts
    return () => {
      if (pcRef.current) {
        pcRef.current.close(); 
        pcRef.current = null;  
      }
    };
  }, []);

  // Function to handle joining an existing game session
  const handleJoinGame = async () => {
    setError(null); 
    setIsConnecting(true);
    
    // Get the current PeerConnection instance
    const pc = pcRef.current;
    if (!pc || pc.signalingState === "closed") {
      setError("PeerConnection is closed or not initialized.");
      setIsConnecting(false);
      return;
    }

    try {
      // Reference to the Firestore document for the given game ID
      const gameRef = doc(db, "games", gameId);
      const gameSnapshot = await getDoc(gameRef); // Retrieve game data

      // Check if the game exists in Firestore
      if (!gameSnapshot.exists()) {
        setError("Game ID not found.");
        setIsConnecting(false);
        return;
      }

      const gameData = gameSnapshot.data();

      // Ensure the host's WebRTC offer exists
      if (!gameData.offer) {
        setError("No offer found for this Game ID.");
        setIsConnecting(false);
        return;
      }

      console.log("Offer received from Firestore:", gameData.offer);

      // Set the remote description with the received offer
      await pc.setRemoteDescription(new RTCSessionDescription(gameData.offer));

      // Generate an answer in response to the offer
      const answer = await createAnswer(pc);

      // Save the answer to Firestore, merging it with existing game data
      await setDoc(gameRef, { answer }, { merge: true });

      console.log("Answer sent to Firestore:", answer);

      // ✅ Navigate to the game board using the entered game ID
      navigate(`/board/${gameId}`);

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