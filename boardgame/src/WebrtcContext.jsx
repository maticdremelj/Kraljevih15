import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import { db } from '../firebaseConfig'; // Assuming firebaseConfig is in the root
import { doc, setDoc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { createPeerConnection, createOffer, createAnswer } from './webrtcUtils'; // Assuming webrtcUtils is in the root

const WebRTCContext = createContext(null);

export const useWebRTC = () => {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTC must be used within a WebRTCProvider');
  }
  return context;
};

export const WebRTCProvider = ({ children }) => {
  const pcRef = useRef(null);
  const dataChannelRef = useRef(null);
  const gameIdRef = useRef(null); // To hold the current gameId reliably
  const [gameId, setGameId] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected'
  const [lastReceivedMessage, setLastReceivedMessage] = useState('');
  const messageCallbacks = useRef([]); // To hold message listeners for Board.jsx

  // Initialize WebRTC Peer Connection and Data Channel
  useEffect(() => {
    pcRef.current = createPeerConnection();
    const pc = pcRef.current;

    // Set up onicecandidate handler for both Host and Joiner
    pc.onicecandidate = async (event) => {
      if (event.candidate && gameIdRef.current) {
        const gameRef = doc(db, "games", gameIdRef.current);
        const existingGameData = await getDoc(gameRef);
        let currentHostCandidates = [];
        let currentGuestCandidates = [];

        if (existingGameData.exists()) {
          currentHostCandidates = existingGameData.data().iceCandidatesHost || [];
          currentGuestCandidates = existingGameData.data().iceCandidatesGuest || [];
        }

        // Determine if we are the host or guest based on current signalling state or if we have an offer
        // This is a simplification; a more robust approach might be to pass role during connection init
        if (pc.localDescription && pc.localDescription.type === 'offer') {
          // We are the host
          await setDoc(gameRef, {
            iceCandidatesHost: [...currentHostCandidates, event.candidate.toJSON()]
          }, { merge: true });
        } else if (pc.localDescription && pc.localDescription.type === 'answer') {
          // We are the guest
          await setDoc(gameRef, {
            iceCandidatesGuest: [...currentGuestCandidates, event.candidate.toJSON()]
          }, { merge: true });
        }
      }
    };

    // Set up data channel handler for the 'joiner' side
    pc.ondatachannel = (event) => {
      const dataChannel = event.channel;
      dataChannelRef.current = dataChannel;
      console.log("WebRTCContext: Data Channel received:", dataChannel.label);
      setupDataChannelListeners(dataChannel);
    };

    const setupDataChannelListeners = (channel) => {
      channel.onopen = () => {
        console.log("WebRTCContext: Data Channel opened!");
        setConnectionStatus('connected');
      };
      channel.onmessage = (event) => {
        console.log("WebRTCContext: Data Channel message:", event.data);
        setLastReceivedMessage(event.data);
        messageCallbacks.current.forEach(callback => callback(event.data));
      };
      channel.onclose = () => {
        console.log("WebRTCContext: Data Channel closed!");
        setConnectionStatus('disconnected');
      };
      channel.onerror = (error) => {
        console.error("WebRTCContext: Data Channel error:", error);
        setConnectionStatus('disconnected');
      };
    };

    return () => {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
        dataChannelRef.current = null;
        gameIdRef.current = null;
      }
    };
  }, []); // Run only once on mount

  // Host function: Create game and offer
  const createGame = useCallback(async () => {
    setConnectionStatus('connecting');
    const pc = pcRef.current;

    // Create data channel for the 'host' side
    const dataChannel = pc.createDataChannel("game_state");
    dataChannelRef.current = dataChannel;
    setupDataChannelListeners(dataChannel);

    const newGameId = Math.random().toString(36).substring(2, 9);
    setGameId(newGameId);
    gameIdRef.current = newGameId; // Update ref immediately

    const offer = await createOffer(pc);
    const gameRef = doc(db, "games", newGameId);
    await setDoc(gameRef, { offer: offer.toJSON() });
    console.log("WebRTCContext: Offer saved to Firestore:", offer);

    // Listen for answer and guest ICE candidates
    const unsubscribe = onSnapshot(gameRef, async (snapshot) => {
      const data = snapshot.data();
      if (data?.answer && pc.signalingState !== "closed" && pc.remoteDescription?.type !== 'answer') {
        console.log("WebRTCContext: Answer received from Firestore:", data.answer);
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
      if (data?.iceCandidatesGuest) {
        for (const candidate of data.iceCandidatesGuest) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error("WebRTCContext: Error adding received guest ICE candidate:", e);
          }
        }
        // Clear candidates from Firestore after processing to prevent re-adding
        await updateDoc(gameRef, { iceCandidatesGuest: [] });
      }
    });

    return { gameId: newGameId, unsubscribe }; // Return gameId and unsubscribe function
  }, []);

  // Join function: Join game and send answer
  const joinGame = useCallback(async (id) => {
    setConnectionStatus('connecting');
    const pc = pcRef.current;

    setGameId(id);
    gameIdRef.current = id; // Update ref immediately

    const gameRef = doc(db, "games", id);
    const gameSnap = await getDoc(gameRef);
    const gameData = gameSnap.data();

    if (!gameData || !gameData.offer) {
      throw new Error("No offer found for this Game ID.");
    }

    console.log("WebRTCContext: Offer received from Firestore:", gameData.offer);
    await pc.setRemoteDescription(new RTCSessionDescription(gameData.offer));

    // Listen for host ICE candidates
    const unsubscribe = onSnapshot(gameRef, async (snapshot) => {
      const data = snapshot.data();
      if (data?.iceCandidatesHost) {
        for (const candidate of data.iceCandidatesHost) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error("WebRTCContext: Error adding received host ICE candidate:", e);
          }
        }
        // Clear candidates from Firestore after processing to prevent re-adding
        await updateDoc(gameRef, { iceCandidatesHost: [] });
      }
    });

    const answer = await createAnswer(pc);
    await setDoc(gameRef, { answer: answer.toJSON() }, { merge: true });
    console.log("WebRTCContext: Answer sent to Firestore:", answer);

    return { unsubscribe }; // Return unsubscribe function
  }, []);

  // Function to send data via the data channel
  const sendDataMessage = useCallback((message) => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      dataChannelRef.current.send(message);
      console.log("WebRTCContext: Sent message:", message);
      return true;
    }
    console.warn("WebRTCContext: Data Channel is not open. Cannot send message.");
    return false;
  }, []);

  // Function to register a callback for incoming messages (for Board.jsx)
  const addMessageListener = useCallback((callback) => {
    messageCallbacks.current.push(callback);
    return () => {
      messageCallbacks.current = messageCallbacks.current.filter(cb => cb !== callback);
    };
  }, []);

  const value = {
    gameId,
    connectionStatus,
    lastReceivedMessage,
    createGame,
    joinGame,
    sendDataMessage,
    addMessageListener,
  };

  return (
    <WebRTCContext.Provider value={value}>
      {children}
    </WebRTCContext.Provider>
  );
};