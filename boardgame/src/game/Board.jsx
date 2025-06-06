import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWebRTC } from '../WebRTCContext'; // Import useWebRTC

const Board = () => {
  const { gameId: paramGameId } = useParams(); // Get gameId from URL params
  const { gameId, connectionStatus, sendDataMessage, addMessageListener } = useWebRTC(); // Use the hook

  const [messageToSend, setMessageToSend] = useState('');
  const [receivedMessages, setReceivedMessages] = useState([]);

  // Use gameId from context, fallback to paramGameId if context not yet populated
  const displayGameId = gameId || paramGameId;

  // Listen for incoming messages
  useEffect(() => {
    const unsubscribe = addMessageListener((message) => {
      setReceivedMessages((prevMessages) => [...prevMessages, message]);
    });

    // Cleanup listener on component unmount
    return () => {
      unsubscribe();
    };
  }, [addMessageListener]);

  const handleSendMessage = () => {
    if (messageToSend.trim() && connectionStatus === 'connected') {
      sendDataMessage(messageToSend);
      setMessageToSend(''); // Clear input after sending
    } else if (connectionStatus !== 'connected') {
      console.warn("Cannot send message: WebRTC Data Channel is not connected.");
    }
  };

  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Game Board</h1>
      {displayGameId && (
        <p className="text-lg mb-2">Game ID: <strong>{displayGameId}</strong></p>
      )}
      <p className="text-md mb-4">Connection Status: <span className={`font-semibold ${connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`}>{connectionStatus}</span></p>

      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-3">Messages</h2>
        <div className="border border-gray-300 p-3 h-40 overflow-y-auto mb-4 rounded">
          {receivedMessages.length === 0 ? (
            <p className="text-gray-500">No messages yet.</p>
          ) : (
            <ul>
              {receivedMessages.map((msg, index) => (
                <li key={index} className="mb-1 p-1 bg-gray-50 rounded text-sm break-words">
                  {msg}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex">
          <input
            type="text"
            className="flex-grow border border-gray-300 p-2 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your message..."
            value={messageToSend}
            onChange={(e) => setMessageToSend(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
            disabled={connectionStatus !== 'connected'}
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600 disabled:bg-blue-300"
            disabled={connectionStatus !== 'connected'}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Board;