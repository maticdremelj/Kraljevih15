import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Import for navigation
import { db } from "../firebaseConfig";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import { createPeerConnection, createOffer } from "../webrtcUtils";

const Host = () => {
  const pcRef = useRef(null);
  const navigate = useNavigate(); // ✅ Hook for navigation
  const [offer, setOffer] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [isCreatingOffer, setIsCreatingOffer] = useState(false);
  const [error, setError] = useState(null);

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

      const newGameId = Math.random().toString().slice(2, 8);
      setGameId(newGameId);

      const gameRef = doc(db, "games", newGameId);
      await setDoc(gameRef, { offer: newOffer });

      console.log("Offer saved to Firestore:", newOffer);

      // ✅ Listen for an answer from the guest
      onSnapshot(gameRef, async (snapshot) => {
        const data = snapshot.data();
        if (data?.answer && pc.signalingState !== "closed") {
          console.log("Answer received from Firestore:", data.answer);
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          navigate(`/board/${newGameId}`); // ✅ Move to Board
        }
      });

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
          <p>Game ID: {gameId}</p>
          <p>Share this Game ID with the guest.</p>
        </div>
      )}
    </div>
  );
};

export default Host;
