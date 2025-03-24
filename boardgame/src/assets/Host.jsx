import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import { createPeerConnection, createOffer } from "../webrtcUtils";

const Host = () => {
  // Reference to store the WebRTC peer connection instance
  const pcRef = useRef(null);

  // Hook to enable navigation between routes
  const navigate = useNavigate();

  // State to store the generated WebRTC offer
  const [offer, setOffer] = useState(null);

  // State to store the unique game ID
  const [gameId, setGameId] = useState(null);

  // State to track whether an offer is being created
  const [isCreatingOffer, setIsCreatingOffer] = useState(false);

  // State to handle error messages
  const [error, setError] = useState(null);

  // useEffect hook to initialize the PeerConnection when the component mounts
  useEffect(() => {
    // Create a new WebRTC PeerConnection and store it in the ref
    pcRef.current = createPeerConnection();
    
    // Cleanup function to close the connection when the component unmounts
    return () => {
      if (pcRef.current) {
        pcRef.current.close(); // Close the connection
        pcRef.current = null;  // Reset the ref
      }
    };
  }, []);

  // Function to handle the creation of a new game
  const handleCreateGame = async () => {
    setError(null); 

    // Prevent duplicate offers from being created
    if (offer) {
      console.log("Offer already created, skipping duplicate.");
      return;
    }

    // Get the current PeerConnection instance
    const pc = pcRef.current;
    if (!pc || pc.signalingState === "closed") {
      setError("PeerConnection is closed or not initialized.");
      return;
    }

    setIsCreatingOffer(true);

    try {
      // Generate an offer using WebRTC
      const newOffer = await createOffer(pc);
      setOffer(newOffer);

      // Generate a random 6-digit game ID
      const newGameId = Math.random().toString().slice(2, 8);
      setGameId(newGameId);

      // Reference to the Firestore document for this game session
      const gameRef = doc(db, "games", newGameId);
      
      // Save the offer in Firestore
      await setDoc(gameRef, { offer: newOffer });
      console.log("Offer saved to Firestore:", newOffer);

      // Listen for an answer from the guest in Firestore
      onSnapshot(gameRef, async (snapshot) => {
        const data = snapshot.data();
        if (data?.answer && pc.signalingState !== "closed") {
          console.log("Answer received from Firestore:", data.answer);

          // Set the remote description using the received answer
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));

          // Navigate to the game board with the generated game ID
          navigate(`/board/${newGameId}`);
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
