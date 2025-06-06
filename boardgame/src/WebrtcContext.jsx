import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import { db } from './firebaseConfig';
import { doc, setDoc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { createPeerConnection, createOffer, createAnswer } from './webrtcUtils';

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
  const gameIdRef = useRef(null);
  const [gameId, setGameId] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastReceivedMessage, setLastReceivedMessage] = useState('');
  const messageCallbacks = useRef([]);
  const remoteDescriptionSet = useRef(false); // Track if remote description is set

  const setupDataChannelListeners = useCallback((channel) => {
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
  }, []);

  // Helper to add ICE candidates
  const handleIceCandidates = useCallback(async (candidates, isHost) => {
      const pc = pcRef.current;
      if (pc && pc.signalingState !== "closed" && pc.remoteDescription && candidates && candidates.length > 0) {
          console.log(`WebRTCContext: Processing new ${isHost ? 'host' : 'guest'} ICE candidates:`, candidates.length);
          for (const candidate of candidates) {
              try {
                  await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (e) {
                  // Ignore errors for duplicate candidates, log others
                  if (!e.message.includes("The ICE candidate has already been added")) {
                      console.error(`WebRTCContext: Error adding received ${isHost ? 'host' : 'guest'} ICE candidate:`, e);
                  }
              }
          }
      }
  }, []);

  useEffect(() => {
    pcRef.current = createPeerConnection();
    const pc = pcRef.current;

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

        if (pc.localDescription && pc.localDescription.type === 'offer') {
          // If we are the host and generating candidates
          await updateDoc(gameRef, {
            iceCandidatesHost: [...currentHostCandidates, event.candidate.toJSON()]
          });
        } else if (pc.localDescription && pc.localDescription.type === 'answer') {
           // If we are the guest and generating candidates
           await updateDoc(gameRef, {
            iceCandidatesGuest: [...currentGuestCandidates, event.candidate.toJSON()]
          });
        }
      }
    };

    pc.ondatachannel = (event) => {
      const dataChannel = event.channel;
      dataChannelRef.current = dataChannel;
      console.log("WebRTCContext: Data Channel received:", dataChannel.label);
      setupDataChannelListeners(dataChannel);
    };

    return () => {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
        dataChannelRef.current = null;
        gameIdRef.current = null;
        remoteDescriptionSet.current = false; // Reset on unmount
      }
    };
  }, [setupDataChannelListeners]); // Dependencies are `setupDataChannelListeners`

  const createGame = useCallback(async () => {
    setConnectionStatus('connecting');
    const pc = pcRef.current;

    const dataChannel = pc.createDataChannel("game_state");
    dataChannelRef.current = dataChannel;
    setupDataChannelListeners(dataChannel);

    const newGameId = Math.random().toString(36).substring(2, 9);
    setGameId(newGameId);
    gameIdRef.current = newGameId;

    const offer = await createOffer(pc);
    const gameRef = doc(db, "games", newGameId);
    await setDoc(gameRef, { offer });
    console.log("WebRTCContext: Offer saved to Firestore:", offer);

    const unsubscribe = onSnapshot(gameRef, async (snapshot) => {
        const data = snapshot.data();
        // Host: Process answer only if PC is in 'have-local-offer' state and remote description not yet set
        if (data?.answer && pc.signalingState === 'have-local-offer' && !remoteDescriptionSet.current) {
            console.log("WebRTCContext: Answer received from Firestore:", data.answer);
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                remoteDescriptionSet.current = true; // Mark as set
                console.log("WebRTCContext: Remote Answer set successfully.");
            } catch (e) {
                console.error("WebRTCContext: Error setting remote description (answer):", e);
            }
        }
        // Host: Process guest ICE candidates
        if (data?.iceCandidatesGuest && data.iceCandidatesGuest.length > 0) {
            await handleIceCandidates(data.iceCandidatesGuest, false);
            await updateDoc(gameRef, { iceCandidatesGuest: [] }); // Clear candidates after processing
        }
    });

    return { gameId: newGameId, unsubscribe };
  }, [setupDataChannelListeners, handleIceCandidates]);

  const joinGame = useCallback(async (id) => {
    setConnectionStatus('connecting');
    const pc = pcRef.current;

    setGameId(id);
    gameIdRef.current = id;

    const gameRef = doc(db, "games", id);
    const gameSnap = await getDoc(gameRef);
    const gameData = gameSnap.data();

    if (!gameData || !gameData.offer) {
      throw new Error("No offer found for this Game ID.");
    }

    console.log("WebRTCContext: Offer received from Firestore:", gameData.offer);
    await pc.setRemoteDescription(new RTCSessionDescription(gameData.offer));
    remoteDescriptionSet.current = true; // Mark as set for joiner too

    const answer = await createAnswer(pc);
    await setDoc(gameRef, { answer }, { merge: true });
    console.log("WebRTCContext: Answer sent to Firestore:", answer);

    const unsubscribe = onSnapshot(gameRef, async (snapshot) => {
        const data = snapshot.data();
        // Joiner: Process host ICE candidates
        if (data?.iceCandidatesHost && data.iceCandidatesHost.length > 0) {
            await handleIceCandidates(data.iceCandidatesHost, true);
            await updateDoc(gameRef, { iceCandidatesHost: [] }); // Clear candidates after processing
        }
    });

    return { unsubscribe };
  }, [setupDataChannelListeners, handleIceCandidates]);

  const sendDataMessage = useCallback((message) => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      dataChannelRef.current.send(message);
      console.log("WebRTCContext: Sent message:", message);
      return true;
    }
    console.warn("WebRTCContext: Data Channel is not open. Cannot send message.");
    return false;
  }, []);

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