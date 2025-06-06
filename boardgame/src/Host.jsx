import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWebRTC } from "./WebRTCContext"; // Import useWebRTC

const Host = () => {
  const navigate = useNavigate();
  const { createGame, gameId, connectionStatus } = useWebRTC(); // Use the hook
  const [offerCreated, setOfferCreated] = useState(false); // To manage UI after offer is created
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

  const handleCreateGame = async () => {
    setError(null);
    setOfferCreated(false); // Reset state
    try {
      const { gameId: newGameId, unsubscribe } = await createGame(); // Call context function
      setOfferCreated(true);
      setUnsubscribeFirestore(() => unsubscribe); // Store unsubscribe function
      console.log("Game created with ID:", newGameId);

      // WebRTC connection is handled by the context.
      // We will navigate to board once connectionStatus is 'connected'
    } catch (err) {
      console.error("Failed to create game:", err);
      setError(`Failed to create game: ${err.message}`);
      setOfferCreated(false); // Reset on error
    }
  };

  // Navigate to board when connection status changes to 'connected'
  useEffect(() => {
    if (connectionStatus === 'connected' && gameId) {
      console.log("Host: Connection established, navigating to board.");
      if (unsubscribeFirestore) {
        unsubscribeFirestore(); // Unsubscribe Firestore listener
        setUnsubscribeFirestore(null); // Clear ref
      }
      navigate(`/board/${gameId}`);
    }
  }, [connectionStatus, gameId, navigate, unsubscribeFirestore]);


  return (
    <div>
      <h1>Host Game</h1>
      <button
        onClick={handleCreateGame}
        disabled={connectionStatus === 'connecting' || offerCreated}
        className="border-2"
      >
        {connectionStatus === 'connecting' ? "Creating..." : "Create Game"}
      </button>
      {error && <p className="text-red-500">{error}</p>}
      {offerCreated && !gameId && (
        <p>Generating game ID and offer...</p>
      )}
      {gameId && (
        <div>
          <p>Game ID: <strong>{gameId}</strong></p>
          <p>Share this ID with your opponent.</p>
          {connectionStatus === 'connecting' && <p>Waiting for opponent to join...</p>}
        </div>
      )}
    </div>
  );
};

export default Host;