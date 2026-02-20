"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useSocket } from "@/components/SocketProvider";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  acceptCall,
  endCall,
  incomingCall,
  setError,
} from "@/redux/features/chat/callSlice";

export function useWebRTC() {
  const { socket, isConnected } = useSocket();
  const dispatch = useAppDispatch();
  const { partner, isMuted, isVideo, status } = useAppSelector(
    (state) => state.call,
  );

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const partnerRef = useRef(partner);
  const isVideoRef = useRef(isVideo);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

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

    pc.ontrack = (event) => {
      console.log("[useWebRTC] Received remote track:", event.track.kind);
      const stream = event.streams[0];
      setRemoteStream(stream);

      if (isVideoRef.current) {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      } else {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream;
        }
      }
    };

    pcRef.current = pc;
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
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    setRemoteStream(null);
  }, []);

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

        if (isVideoRef.current && localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("webrtc:offer", { to: receiverId || partner?.id, offer });
      } catch (err: any) {
        console.error("Microphone access error:", err);
        dispatch(
          setError("Could not access microphone. Please check permissions."),
        );
        socket.emit("call:end", { to: receiverId || partner?.id });
      }
    };

    const handleCallRejected = () => {
      dispatch(setError("Call rejected"));
      setTimeout(() => dispatch(endCall()), 3000);
    };

    const handleWebRTCOffer = async ({ from, offer }: any) => {
      const pc = createPeerConnection();
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        if (!localStreamRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: isVideoRef.current,
          });
          localStreamRef.current = stream;

          if (isVideoRef.current && localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }

          stream.getTracks().forEach((track) => pc.addTrack(track, stream));
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
      if (pcRef.current) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    const handleCallEnded = () => {
      cleanup();
      dispatch(endCall());
    };

    socket.on("call:incoming", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("call:rejected", handleCallRejected);
    socket.on("webrtc:offer", handleWebRTCOffer);
    socket.on("webrtc:answer", handleWebRTCAnswer);
    socket.on("webrtc:ice-candidate", handleICECandidate);
    socket.on("call:ended", handleCallEnded);

    return () => {
      socket.off("call:incoming", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("call:rejected", handleCallRejected);
      socket.off("webrtc:offer", handleWebRTCOffer);
      socket.off("webrtc:answer", handleWebRTCAnswer);
      socket.off("webrtc:ice-candidate", handleICECandidate);
      socket.off("call:ended", handleCallEnded);
    };
  }, [
    socket,
    isConnected,
    dispatch,
    createPeerConnection,
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

  return { remoteAudioRef, localVideoRef, remoteVideoRef, cleanup };
}
