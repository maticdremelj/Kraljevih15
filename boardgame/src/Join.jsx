import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWebRTC } from "./WebRTCContext"; // Import useWebRTC

const Join = () => {
  const navigate = useNavigate();
  const { joinGame, gameId, connectionStatus } = useWebRTC(); // Use the hook
  const [inputGameId, setInputGameId] = useState(""); // For the input field
  const [error, setError] = useState(null);
  const [unsubscribeFirestore, setUnsubscribeFirestore] = useState(null); // To store unsubscribe function

  useEffect(() => {
    // Cleanup Firestore listener when component unmounts or if unsubscribeFirestore changes
    return () => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, [unsubscribeFirestore]);

  const handleJoinGame = async () => {
    setError(null);
    try {
      const { unsubscribe } = await joinGame(inputGameId); // Call context function
      setUnsubscribeFirestore(() => unsubscribe); // Store unsubscribe function
      console.log("Attempting to join game ID:", inputGameId);

      // WebRTC connection is handled by the context.
      // We will navigate to board once connectionStatus is 'connected'
    } catch (err) {
      console.error("Failed to join game:", err);
      setError(`Failed to join game: ${err.message}`);
    }
  };

  // Navigate to board when connection status changes to 'connected'
  useEffect(() => {
    if (connectionStatus === 'connected' && gameId) {
      console.log("Joiner: Connection established, navigating to board.");
      if (unsubscribeFirestore) {
        unsubscribeFirestore(); // Unsubscribe Firestore listener
        setUnsubscribeFirestore(null); // Clear ref
      }
      navigate(`/board/${gameId}`);
    }
  }, [connectionStatus, gameId, navigate, unsubscribeFirestore]);

  return (
    <div>
      <h1>Join Game</h1>
      <input
        type="text"
        placeholder="Enter Game ID"
        value={inputGameId}
        onChange={(e) => setInputGameId(e.target.value)}
        className="border-2 p-2"
      />
      <button
        onClick={handleJoinGame}
        disabled={connectionStatus === 'connecting' || !inputGameId}
        className="border-2 ml-2"
      >
        {connectionStatus === 'connecting' ? "Connecting..." : "Join Game"}
      </button>
      {error && <p className="text-red-500">{error}</p>}
      {connectionStatus === 'connecting' && <p>Connecting to game...</p>}
    </div>
  );
};

export default Join;