"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useSocket } from "@/components/SocketProvider";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  acceptCall,
  endCall,
  incomingCall,
  setError,
  setWarning,
  setScreenSharing,
  setRemoteScreenTrackId,
} from "@/redux/features/chat/callSlice";

export function useWebRTC() {
  const { socket, isConnected } = useSocket();
  const dispatch = useAppDispatch();
  const { partner, isMuted, isVideo, status, remoteScreenTrackId } =
    useAppSelector((state) => state.call);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const screenPcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const partnerRef = useRef(partner);
  const isVideoRef = useRef(isVideo);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenSenderRef = useRef<RTCRtpSender | null>(null);
  const iceCandidatesQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const screenIceCandidatesQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [remoteScreenStream, setRemoteScreenStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    isVideoRef.current = isVideo;
  }, [isVideo]);

  useEffect(() => {
    partnerRef.current = partner;
  }, [partner]);

  const createPeerConnection = useCallback(() => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: [
            "turn:free.expressturn.com:3478",
            "turn:free.expressturn.com:3478?transport=tcp",
          ],
          username: process.env.NEXT_PUBLIC_TURN_USERNAME!,
          credential: process.env.NEXT_PUBLIC_TURN_PASSWORD!,
        },
      ],
      iceTransportPolicy: "all",
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && partnerRef.current?.id && socket) {
        socket.emit("webrtc:ice-candidate", {
          to: partnerRef.current.id,
          candidate: event.candidate,
        });
      }
    };

    pc.onnegotiationneeded = async () => {
      try {
        if (pc.signalingState !== "stable") return;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket?.emit("webrtc:offer", {
          to: partnerRef.current?.id,
          offer,
        });
      } catch (err) {
        console.error("Negotiation failed:", err);
      }
    };

    pc.ontrack = (event) => {
      console.log("[useWebRTC] Received remote track:", event.track.kind);
      const stream = event.streams[0] || new MediaStream([event.track]);
      setRemoteStream(stream);
    };

    pcRef.current = pc;
    return pc;
  }, [socket]);

  const createScreenPeerConnection = useCallback(() => {
    if (screenPcRef.current) return screenPcRef.current;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: [
            "turn:free.expressturn.com:3478",
            "turn:free.expressturn.com:3478?transport=tcp",
          ],
          username: process.env.NEXT_PUBLIC_TURN_USERNAME!,
          credential: process.env.NEXT_PUBLIC_TURN_PASSWORD!,
        },
      ],
      iceTransportPolicy: "all",
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && partnerRef.current?.id && socket) {
        socket.emit("webrtc:screen_ice-candidate", {
          to: partnerRef.current.id,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log("[useWebRTC] Received remote screen track:", event.track.kind);
      const stream = event.streams[0] || new MediaStream([event.track]);
      setRemoteScreenStream(stream);
    };

    screenPcRef.current = pc;
    return pc;
  }, [socket]);

  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (screenPcRef.current) {
      screenPcRef.current.close();
      screenPcRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    iceCandidatesQueueRef.current = [];
    screenIceCandidatesQueueRef.current = [];
    setRemoteStream(null);
    setRemoteScreenStream(null);
    setLocalStream(null);

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setLocalScreenStream(null);
  }, []);

  const startScreenShare = useCallback(async () => {
    try {
      if (!pcRef.current || !socket || !partnerRef.current?.id) return;

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920, max: 3840 },
          height: { ideal: 1080, max: 2160 },
          frameRate: { ideal: 60, max: 60 },
        },
        audio: true,
      });

      screenStreamRef.current = screenStream;
      setLocalScreenStream(screenStream);

      const pc = createScreenPeerConnection();

      const screenTrack = screenStream.getVideoTracks()[0];

      const sender = pc.addTrack(screenTrack, screenStream);
      screenSenderRef.current = sender;

      if (sender) {
        try {
          const params = sender.getParameters();
          if (!params.encodings) params.encodings = [{}];
          params.encodings[0].maxBitrate = 5000000;
          params.degradationPreference = "maintain-resolution";
          await sender.setParameters(params);
        } catch (e) {
          console.warn("Failed to set screen share sender parameters", e);
        }
      }

      // Explicitly create and send the offer (don't rely on onnegotiationneeded)
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("webrtc:screen_offer", {
        to: partnerRef.current.id,
        offer,
      });

      // Notify partner about the screen share AFTER the offer is sent
      socket.emit("webrtc:screen_started", {
        to: partnerRef.current.id,
        trackId: screenStream.id,
      });

      dispatch(setScreenSharing(true));

      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.error("Error sharing screen:", err);
      dispatch(setError("Could not start screen share."));
    }
  }, [dispatch, socket, createScreenPeerConnection]);

  const stopScreenShare = useCallback(async () => {
    try {
      if (!pcRef.current) return;

      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
        setLocalScreenStream(null);
      }

      if (screenSenderRef.current && screenPcRef.current) {
        screenPcRef.current.removeTrack(screenSenderRef.current);
        screenSenderRef.current = null;
      }

      if (screenPcRef.current) {
        screenPcRef.current.close();
        screenPcRef.current = null;
      }

      if (socket && partnerRef.current?.id) {
        socket.emit("webrtc:screen_stopped", {
          to: partnerRef.current.id,
        });
      }

      dispatch(setScreenSharing(false));
    } catch (err) {
      console.error("Error stopping screen share:", err);
    }
  }, [dispatch, socket]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleIncomingCall = (data: any) => {
      console.log("[useWebRTC] Incoming call data received:", data);
      const { callerId, callerInfo } = data;

      if (!callerInfo) {
        console.error("[useWebRTC] Received call:incoming without callerInfo!");
        return;
      }

      dispatch(
        incomingCall({
          id: callerId,
          name: callerInfo.name || "Unknown User",
          image: callerInfo.image,
          isVideo: !!callerInfo.isVideo,
        }),
      );
    };

    const handleCallAccepted = async (data: any) => {
      console.log("[useWebRTC] Call accepted data received:", data);
      const { receiverId, receiverInfo } = data;

      dispatch(
        acceptCall(
          receiverInfo
            ? {
                id: receiverId,
                name: receiverInfo.name,
                image: receiverInfo.image,
              }
            : undefined,
        ),
      );

      const pc = createPeerConnection();

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: isVideoRef.current,
        });
        localStreamRef.current = stream;
        setLocalStream(stream);

        if (isVideoRef.current && localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      } catch (err: any) {
        console.warn("Microphone access error, joining listen-only:", err);
        dispatch(
          setWarning(
            "Microphone/Camera unavailable, joining in listen-only mode.",
          ),
        );
        localStreamRef.current = null;

        pc.addTransceiver("audio", { direction: "recvonly" });
        if (isVideoRef.current) {
          pc.addTransceiver("video", { direction: "recvonly" });
        }
      }

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("webrtc:offer", { to: receiverId || partner?.id, offer });
      } catch (err) {
        console.error("Error creating or sending offer", err);
        socket.emit("call:end", { to: receiverId || partner?.id });
      }
    };

    const handleCallRejected = () => {
      dispatch(setError("Call rejected"));
      setTimeout(() => dispatch(endCall()), 3000);
    };

    const handleWebRTCOffer = async ({ from, offer }: any) => {
      let pc = pcRef.current;
      if (!pc || pc.signalingState === "closed") {
        pc = createPeerConnection();
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        
        for (const c of iceCandidatesQueueRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        }
        iceCandidatesQueueRef.current = [];

        if (!localStreamRef.current) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: isVideoRef.current,
            });
            localStreamRef.current = stream;
            setLocalStream(stream);

            if (isVideoRef.current && localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }

            stream.getTracks().forEach((track) => pc.addTrack(track, stream));
          } catch (mediaErr) {
            console.warn(
              "Media access failed, answering without tracks:",
              mediaErr,
            );
            dispatch(
              setWarning(
                "Microphone/Camera unavailable, joining in listen-only mode.",
              ),
            );
          }
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc:answer", { to: from, answer });
      } catch (err) {
        console.error("Error handling offer", err);
        dispatch(setError("WebRTC handshake failed"));
      }
    };

    const handleWebRTCAnswer = async ({ answer }: any) => {
      if (pcRef.current) {
        try {
          await pcRef.current.setRemoteDescription(
            new RTCSessionDescription(answer),
          );
        } catch (err) {
          console.error("Error handling answer", err);
          dispatch(setError("WebRTC handshake failed"));
        }
      }
    };

    const handleICECandidate = async ({ candidate }: any) => {
      if (pcRef.current && pcRef.current.remoteDescription) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        iceCandidatesQueueRef.current.push(candidate);
      }
    };

    const handleCallEnded = () => {
      cleanup();
      dispatch(endCall());
    };

    const handleScreenOffer = async ({ from, offer }: any) => {
      let pc = screenPcRef.current;
      if (!pc || pc.signalingState === "closed") {
        pc = createScreenPeerConnection();
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        for (const c of screenIceCandidatesQueueRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        }
        screenIceCandidatesQueueRef.current = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc:screen_answer", { to: from, answer });
      } catch (err) {
        console.error("Error handling screen offer", err);
      }
    };

    const handleScreenAnswer = async ({ answer }: any) => {
      if (screenPcRef.current) {
        try {
          await screenPcRef.current.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
        } catch (err) {
          console.error("Error handling screen answer", err);
        }
      }
    };

    const handleScreenICECandidate = async ({ candidate }: any) => {
      if (screenPcRef.current && screenPcRef.current.remoteDescription) {
        await screenPcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        screenIceCandidatesQueueRef.current.push(candidate);
      }
    };

    const handleScreenStarted = ({ trackId }: any) => {
      console.log("[useWebRTC] Remote started screen share");
      dispatch(setRemoteScreenTrackId("active"));
    };

    const handleScreenStopped = () => {
      console.log("[useWebRTC] Remote stopped screen share");
      if (screenPcRef.current) {
        screenPcRef.current.close();
        screenPcRef.current = null;
      }
      setRemoteScreenStream(null);
      dispatch(setRemoteScreenTrackId(null));
    };

    socket.on("call:incoming", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("call:rejected", handleCallRejected);
    socket.on("webrtc:offer", handleWebRTCOffer);
    socket.on("webrtc:answer", handleWebRTCAnswer);
    socket.on("webrtc:ice-candidate", handleICECandidate);
    socket.on("call:ended", handleCallEnded);
    socket.on("webrtc:screen_offer", handleScreenOffer);
    socket.on("webrtc:screen_answer", handleScreenAnswer);
    socket.on("webrtc:screen_ice-candidate", handleScreenICECandidate);
    socket.on("webrtc:screen_started", handleScreenStarted);
    socket.on("webrtc:screen_stopped", handleScreenStopped);

    return () => {
      socket.off("call:incoming", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("call:rejected", handleCallRejected);
      socket.off("webrtc:offer", handleWebRTCOffer);
      socket.off("webrtc:answer", handleWebRTCAnswer);
      socket.off("webrtc:ice-candidate", handleICECandidate);
      socket.off("call:ended", handleCallEnded);
      socket.off("webrtc:screen_offer", handleScreenOffer);
      socket.off("webrtc:screen_answer", handleScreenAnswer);
      socket.off("webrtc:screen_ice-candidate", handleScreenICECandidate);
      socket.off("webrtc:screen_started", handleScreenStarted);
      socket.off("webrtc:screen_stopped", handleScreenStopped);
    };
  }, [
    socket,
    isConnected,
    dispatch,
    createPeerConnection,
    createScreenPeerConnection,
    partner?.id,
    cleanup,
  ]);

  useEffect(() => {
    if (remoteStream) {
      if (isVideo && remoteVideoRef.current) {
        if (remoteVideoRef.current.srcObject !== remoteStream) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      } else if (!isVideo && remoteAudioRef.current) {
        if (remoteAudioRef.current.srcObject !== remoteStream) {
          remoteAudioRef.current.srcObject = remoteStream;
        }
      }
    }
  }, [remoteStream, isVideo, status]);

  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  return {
    remoteAudioRef,
    localVideoRef,
    remoteVideoRef,
    cleanup,
    startScreenShare,
    stopScreenShare,
    remoteStream,
    remoteScreenStream,
    localStream,
    localScreenStream,
  };
}
