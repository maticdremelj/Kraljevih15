import { useEffect, useRef, useState } from "react";
import { createPeerConnection, createOffer } from "../webrtcUtils";

const Host = () => {
  const pcRef = useRef(null);
  const [offer, setOffer] = useState(null);
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
    // Reset error state
    setError(null);
    
    // Check if we already have an offer
    if (offer) {
      console.log("Offer already created, skipping duplicate.");
      return;
    }

    const pc = pcRef.current;
    if (!pc || pc.signalingState === "closed") {
      setError("PeerConnection is closed or not initialized.");
      return;
    }

    // Set loading state
    setIsCreatingOffer(true);
    
    try {
      const newOffer = await createOffer(pc);
      setOffer(newOffer);
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
      {offer && <p>Offer created. Share it with the guest.</p>}
    </div>
  );
};

export default Host;