import { useEffect, useRef, useState } from "react";
import { db } from "../firebaseConfig"; // Import Firestore instance
import { doc, setDoc } from "firebase/firestore";
import { createPeerConnection, createOffer } from "../webrtcUtils";

const Host = () => {
  const pcRef = useRef(null);
  const [offer, setOffer] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [isCreatingOffer, setIsCreatingOffer] = useState(false);
  const [error, setError] = useState(null);

  // Initialize peer connection
  useEffect(() => {
    pcRef.current = createPeerConnection();
    
    return () => {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, []);

  const handleCreateGame = async () => {
    setError(null);
    
    if (offer) {
      console.log("Offer already created, skipping duplicate.");
      return;
    }

    const pc = pcRef.current;
    if (!pc || pc.signalingState === "closed") {
      setError("PeerConnection is closed or not initialized.");
      return;
    }

    setIsCreatingOffer(true);
    
    try {
      const newOffer = await createOffer(pc);
      setOffer(newOffer);

      // Generate a unique game ID (can be replaced with a UUID or user input)
      const newGameId = Math.random().toString().slice(2, 8);
      setGameId(newGameId);

      // Store the offer in Firestore
      const gameRef = doc(db, "games", newGameId);
      await setDoc(gameRef, { offer: newOffer });

      console.log("Offer saved to Firestore:", newOffer);
    } catch (err) {
      console.error("Failed to create offer:", err);
      setError(`Failed to create offer: ${err.message}`);
    } finally {
      setIsCreatingOffer(false);
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
          <p>Offer created and shared.</p>
          <p><strong>Game ID:</strong> {gameId}</p>
          <p>Share this Game ID with the guest.</p>
        </div>
      )}
    </div>
  );
};

export default Host;