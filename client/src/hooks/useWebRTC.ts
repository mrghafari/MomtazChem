import { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";

interface Participant {
  socketId: string;
  userId: string;
  userName: string;
  isHost: boolean;
  isMuted: boolean;
  hasVideo: boolean;
  isScreenSharing: boolean;
}

interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  message: string;
  messageType: string;
  createdAt: Date;
}

export function useWebRTC() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [hasVideo, setHasVideo] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // WebRTC configuration
  const iceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(window.location.origin, {
      path: "/socket.io"
    });

    newSocket.on("connect", () => {
      console.log("🔌 Connected to WebRTC server");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Disconnected from WebRTC server");
      setIsConnected(false);
    });

    // WebRTC events
    newSocket.on("room-joined", (data: { roomId: string; participants: Participant[] }) => {
      console.log("✅ Joined room:", data.roomId);
      setCurrentRoom(data.roomId);
      setParticipants(data.participants);
      
      // Create peer connections for existing participants
      data.participants.forEach((participant) => {
        if (participant.socketId !== newSocket.id) {
          createPeerConnection(participant.socketId, true);
        }
      });
    });

    newSocket.on("user-joined", (data: { socketId: string; userId: string; userName: string }) => {
      console.log("👤 User joined:", data.userName);
      setParticipants(prev => [...prev, {
        socketId: data.socketId,
        userId: data.userId,
        userName: data.userName,
        isHost: false,
        isMuted: false,
        hasVideo: true,
        isScreenSharing: false
      }]);
      
      // Create peer connection for new participant
      createPeerConnection(data.socketId, false);
    });

    newSocket.on("user-left", (data: { socketId: string; userId: string; userName: string }) => {
      console.log("👋 User left:", data.userName);
      setParticipants(prev => prev.filter(p => p.socketId !== data.socketId));
      
      // Close peer connection
      const pc = peerConnections.current.get(data.socketId);
      if (pc) {
        pc.close();
        peerConnections.current.delete(data.socketId);
      }
      
      // Remove remote stream
      setRemoteStreams(prev => {
        const newStreams = new Map(prev);
        newStreams.delete(data.socketId);
        return newStreams;
      });
    });

    // WebRTC signaling
    newSocket.on("offer", async (data: { offer: RTCSessionDescriptionInit; from: string }) => {
      const pc = peerConnections.current.get(data.from);
      if (pc) {
        await pc.setRemoteDescription(data.offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        newSocket.emit("answer", { answer, to: data.from, roomId: currentRoom });
      }
    });

    newSocket.on("answer", async (data: { answer: RTCSessionDescriptionInit; from: string }) => {
      const pc = peerConnections.current.get(data.from);
      if (pc) {
        await pc.setRemoteDescription(data.answer);
      }
    });

    newSocket.on("ice-candidate", async (data: { candidate: RTCIceCandidateInit; from: string }) => {
      const pc = peerConnections.current.get(data.from);
      if (pc) {
        await pc.addIceCandidate(data.candidate);
      }
    });

    // Chat messages
    newSocket.on("chat-message", (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });

    // Audio/Video controls
    newSocket.on("user-audio-toggle", (data: { socketId: string; userId: string; isMuted: boolean }) => {
      setParticipants(prev => prev.map(p => 
        p.socketId === data.socketId ? { ...p, isMuted: data.isMuted } : p
      ));
    });

    newSocket.on("user-video-toggle", (data: { socketId: string; userId: string; hasVideo: boolean }) => {
      setParticipants(prev => prev.map(p => 
        p.socketId === data.socketId ? { ...p, hasVideo: data.hasVideo } : p
      ));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      // Close all peer connections
      peerConnections.current.forEach(pc => pc.close());
      peerConnections.current.clear();
      // Stop all streams
      localStream?.getTracks().forEach(track => track.stop());
      screenStream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  // Create peer connection
  const createPeerConnection = (socketId: string, createOffer: boolean) => {
    const pc = new RTCPeerConnection({ iceServers });

    // Add local stream tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStreams(prev => new Map(prev.set(socketId, remoteStream)));
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("ice-candidate", {
          candidate: event.candidate,
          to: socketId,
          roomId: currentRoom
        });
      }
    };

    peerConnections.current.set(socketId, pc);

    // Create offer if needed
    if (createOffer) {
      pc.createOffer().then(offer => {
        pc.setLocalDescription(offer);
        if (socket) {
          socket.emit("offer", { offer, to: socketId, roomId: currentRoom });
        }
      });
    }

    return pc;
  };

  // Join room
  const joinRoom = async (roomId: string, userName: string, userId: string) => {
    if (!socket) return;

    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Join room
      socket.emit("join-room", { roomId, userName, userId });
    } catch (error) {
      console.error("❌ Failed to get user media:", error);
    }
  };

  // Leave room
  const leaveRoom = () => {
    if (socket && currentRoom) {
      socket.emit("leave-room", { roomId: currentRoom });
    }
    
    // Stop local stream
    localStream?.getTracks().forEach(track => track.stop());
    setLocalStream(null);
    
    // Stop screen stream
    screenStream?.getTracks().forEach(track => track.stop());
    setScreenStream(null);
    
    // Close peer connections
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();
    
    // Reset state
    setCurrentRoom(null);
    setParticipants([]);
    setMessages([]);
    setRemoteStreams(new Map());
    setIsScreenSharing(false);
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStream && socket && currentRoom) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        socket.emit("toggle-audio", { roomId: currentRoom, isMuted: !audioTrack.enabled });
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream && socket && currentRoom) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setHasVideo(videoTrack.enabled);
        socket.emit("toggle-video", { roomId: currentRoom, hasVideo: videoTrack.enabled });
      }
    }
  };

  // Start screen sharing
  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      setScreenStream(stream);
      setIsScreenSharing(true);
      
      // Replace video track in all peer connections
      const videoTrack = stream.getVideoTracks()[0];
      peerConnections.current.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });
      
      if (socket && currentRoom) {
        socket.emit("start-screen-share", { roomId: currentRoom });
      }
      
      // Handle screen share end
      videoTrack.onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      console.error("❌ Failed to start screen share:", error);
    }
  };

  // Stop screen sharing
  const stopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
      setIsScreenSharing(false);
      
      // Replace back to camera
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        peerConnections.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        });
      }
      
      if (socket && currentRoom) {
        socket.emit("stop-screen-share", { roomId: currentRoom });
      }
    }
  };

  // Send chat message
  const sendMessage = (message: string) => {
    if (socket && currentRoom) {
      socket.emit("chat-message", { roomId: currentRoom, message });
    }
  };

  return {
    socket,
    localStream,
    screenStream,
    remoteStreams,
    participants,
    messages,
    isConnected,
    currentRoom,
    isMuted,
    hasVideo,
    isScreenSharing,
    localVideoRef,
    joinRoom,
    leaveRoom,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    sendMessage
  };
}