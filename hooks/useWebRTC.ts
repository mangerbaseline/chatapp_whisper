"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useSocket } from "@/components/SocketProvider";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  acceptCall,
  endCall,
  incomingCall,
  setWarning,
  setScreenSharing,
  setRemoteScreenTrackId,
  addParticipant,
  removeParticipant,
  setParticipantJoined,
} from "@/redux/features/chat/callSlice";
import { RootState } from "@/redux/store";

export function useWebRTC() {
  const { socket, isConnected } = useSocket();
  const dispatch = useAppDispatch();
  const { conversationId, isMuted, isVideo } = useAppSelector(
    (state) => state.call,
  );
  const currentUser = useAppSelector((state: RootState) => state.auth.user);

  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const screenPcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenSendersRef = useRef<Map<string, RTCRtpSender>>(new Map());

  const [remoteStreams, setRemoteStreams] = useState<
    Record<string, MediaStream>
  >({});
  const [remoteScreenStreams, setRemoteScreenStreams] = useState<
    Record<string, MediaStream>
  >({});
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [localScreenStream, setLocalScreenStream] =
    useState<MediaStream | null>(null);

  const isVideoRef = useRef(isVideo);
  const conversationIdRef = useRef(conversationId);

  useEffect(() => {
    isVideoRef.current = isVideo;
  }, [isVideo]);
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  const createPeerConnection = useCallback(
    (targetUserId: string, isScreen = false) => {
      const map = isScreen ? screenPcsRef.current : pcsRef.current;
      if (map.has(targetUserId)) return map.get(targetUserId)!;

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
      });

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit(
            isScreen ? "webrtc:screen_ice-candidate" : "webrtc:ice-candidate",
            {
              to: targetUserId,
              candidate: event.candidate,
            },
          );
        }
      };

      pc.ontrack = (event) => {
        console.log(
          `[WebRTC] Track received: ${event.track.kind} from ${targetUserId}`,
        );
        const stream = event.streams[0] || new MediaStream([event.track]);

        if (isScreen) {
          setRemoteScreenStreams((prev) => ({
            ...prev,
            [targetUserId]: stream,
          }));
          dispatch(setRemoteScreenTrackId("active"));
        } else {
          setRemoteStreams((prev) => {
            const existingStream = prev[targetUserId];
            if (existingStream) {
              if (
                !existingStream.getTracks().find((t) => t.id === event.track.id)
              ) {
                console.log(
                  `[WebRTC] Adding track ${event.track.kind} to existing stream for ${targetUserId}`,
                );
                existingStream.addTrack(event.track);
              }
              // Force a new reference to trigger reactivity
              return { ...prev, [targetUserId]: existingStream };
            }
            console.log(
              `[WebRTC] Creating new stream for ${targetUserId} with track ${event.track.kind}`,
            );
            return { ...prev, [targetUserId]: stream };
          });
          dispatch(setParticipantJoined({ id: targetUserId, joined: true }));
        }
      };

      map.set(targetUserId, pc);
      return pc;
    },
    [socket, dispatch],
  );

  const mediaPromiseRef = useRef<Promise<MediaStream | null> | null>(null);

  const startLocalMedia = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    if (mediaPromiseRef.current) return mediaPromiseRef.current;

    const promise = (async () => {
      try {
        console.log(
          `[WebRTC] Requesting local media. isVideo: ${isVideoRef.current}`,
        );
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: isVideoRef.current,
        });
        localStreamRef.current = stream;
        setLocalStream(stream);
        return stream;
      } catch (e: any) {
        console.error(`[WebRTC] getUserMedia failed:`, e);
        if (isVideoRef.current) {
          console.warn(`[WebRTC] Fallback to audio-only since video failed.`);
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: false,
            });
            localStreamRef.current = audioStream;
            setLocalStream(audioStream);
            return audioStream;
          } catch (audioError) {
            console.error(
              `[WebRTC] audio-only fallback also failed:`,
              audioError,
            );
          }
        }
        dispatch(setWarning("Media access denied or device missing."));
        return null;
      } finally {
        mediaPromiseRef.current = null;
      }
    })();

    mediaPromiseRef.current = promise;
    return promise;
  }, [dispatch]);

  const cleanup = useCallback(() => {
    if (socket && conversationIdRef.current) {
      socket.emit("call:leave", { conversationId: conversationIdRef.current });
    }

    pcsRef.current.forEach((pc) => pc.close());
    pcsRef.current.clear();
    screenPcsRef.current.forEach((pc) => pc.close());
    screenPcsRef.current.clear();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }

    setRemoteStreams({});
    setRemoteScreenStreams({});
    setLocalStream(null);
    setLocalScreenStream(null);
    dispatch(endCall());
  }, [socket, dispatch]);

  const addLocalTracksToPc = useCallback((pc: RTCPeerConnection) => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        const senders = pc.getSenders();
        const alreadyExists = senders.some((s) => s.track?.id === track.id);
        if (!alreadyExists) {
          pc.addTrack(track, localStreamRef.current!);
        }
      });
    }
  }, []);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      screenStreamRef.current = stream;
      setLocalScreenStream(stream);
      dispatch(setScreenSharing(true));

      pcsRef.current.forEach(async (pc, userId) => {
        const screenPc = createPeerConnection(userId, true);
        const track = stream.getVideoTracks()[0];
        const sender = screenPc.addTrack(track, stream);
        screenSendersRef.current.set(userId, sender);

        const offer = await screenPc.createOffer();
        await screenPc.setLocalDescription(offer);
        socket?.emit("webrtc:screen_offer", { to: userId, offer });
      });

      stream.getVideoTracks()[0].onended = () => stopScreenShare();
    } catch (err) {
      console.error("Screen share failed:", err);
    }
  }, [socket, createPeerConnection, dispatch]);

  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    screenPcsRef.current.forEach((pc, userId) => {
      socket?.emit("webrtc:screen_stopped", { to: userId });
      pc.close();
    });
    screenPcsRef.current.clear();
    setLocalScreenStream(null);
    dispatch(setScreenSharing(false));
  }, [socket, dispatch]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleIncomingCall = (data: any) => {
      const filteredParticipants = data.participants.filter(
        (p: any) => p.id !== currentUser?._id,
      );
      const caller = {
        id: data.callerId,
        name: data.callerInfo?.name || "User",
        image: data.callerInfo?.image,
        isJoined: true,
      };
      dispatch(
        incomingCall({
          ...data,
          participants: [caller, ...filteredParticipants],
        }),
      );
    };

    const handleCallAccepted = async (data: any) => {
      const { receiverId, receiverInfo } = data;
      dispatch(acceptCall());
      dispatch(addParticipant({ id: receiverId, ...receiverInfo }));

      await startLocalMedia();
    };

    const handlePeerJoined = async ({ userId, userInfo }: any) => {
      console.log("Peer joined call:", userId);
      dispatch(addParticipant({ id: userId, ...userInfo }));

      const pc = createPeerConnection(userId);
      const stream = await startLocalMedia();
      if (stream) {
        addLocalTracksToPc(pc);
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("webrtc:offer", { to: userId, offer });
    };

    const handleWebRTCOffer = async ({ from, offer }: any) => {
      console.log(`[WebRTC] Received offer from ${from}`);
      const pc = createPeerConnection(from);

      if ((pc.signalingState as any) === "closed") {
        console.warn(
          `[WebRTC] Ignoring offer, PeerConnection for ${from} is closed`,
        );
        return;
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const stream = await startLocalMedia();
      if (stream) {
        const transceivers = pc.getTransceivers();
        for (const track of stream.getTracks()) {
          const transceiver = transceivers.find(
            (t) => t.receiver.track?.kind === track.kind && !t.sender.track,
          );
          if (transceiver) {
            await transceiver.sender.replaceTrack(track);
            transceiver.direction = "sendrecv";
          } else {
            pc.addTrack(track, stream);
          }
        }
      }

      if (pc.signalingState !== ("closed" as any)) {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc:answer", { to: from, answer });
      }
    };

    const handleWebRTCAnswer = async ({ from, answer }: any) => {
      console.log(`[WebRTC] Received answer from ${from}`);
      const pc = pcsRef.current.get(from);
      if (pc && (pc.signalingState as any) !== "closed") {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const handleICECandidate = async ({ from, candidate }: any) => {
      const pc = pcsRef.current.get(from);
      if (pc && (pc.signalingState as any) !== "closed") {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    const handlePeerLeft = ({ userId }: any) => {
      console.log(`[WebRTC] Peer left: ${userId}`);
      const pc = pcsRef.current.get(userId);
      if (pc) {
        pc.close();
        pcsRef.current.delete(userId);
      }
      const screenPc = screenPcsRef.current.get(userId);
      if (screenPc) {
        screenPc.close();
        screenPcsRef.current.delete(userId);
      }
      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      setRemoteScreenStreams((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      dispatch(removeParticipant(userId));

      if (pcsRef.current.size === 0) {
        cleanup();
      }
    };

    const handleCallRejected = ({ receiverId }: any) => {
      console.log(`[WebRTC] Call rejected/cancelled by: ${receiverId}`);
      cleanup();
    };

    const handleCallEnded = ({ from }: any) => {
      console.log(`[WebRTC] Call ended by: ${from}`);
      cleanup();
    };

    socket.on("call:incoming", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("call:peer_joined", handlePeerJoined);
    socket.on("webrtc:offer", handleWebRTCOffer);
    socket.on("webrtc:answer", handleWebRTCAnswer);
    socket.on("webrtc:ice-candidate", handleICECandidate);
    socket.on("call:peer_left", handlePeerLeft);
    socket.on("call:rejected", handleCallRejected);
    socket.on("call:ended", handleCallEnded);

    socket.on("webrtc:screen_offer", async ({ from, offer }: any) => {
      const pc = createPeerConnection(from, true);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc:screen_answer", { to: from, answer });
    });

    socket.on("webrtc:screen_answer", async ({ from, answer }: any) => {
      const pc = screenPcsRef.current.get(from);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on(
      "webrtc:screen_ice-candidate",
      async ({ from, candidate }: any) => {
        const pc = screenPcsRef.current.get(from);
        if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
      },
    );

    socket.on("webrtc:screen_stopped", ({ from }: any) => {
      const pc = screenPcsRef.current.get(from);
      if (pc) {
        pc.close();
        screenPcsRef.current.delete(from);
      }
      setRemoteScreenStreams((prev) => {
        const next = { ...prev };
        delete next[from];
        return next;
      });
      dispatch(setRemoteScreenTrackId(null));
    });

    return () => {
      socket.off("call:incoming", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("call:peer_joined", handlePeerJoined);
      socket.off("webrtc:offer", handleWebRTCOffer);
      socket.off("webrtc:answer", handleWebRTCAnswer);
      socket.off("webrtc:ice-candidate", handleICECandidate);
      socket.off("call:peer_left", handlePeerLeft);
      socket.off("call:rejected", handleCallRejected);
      socket.off("call:ended", handleCallEnded);
      socket.off("webrtc:screen_offer");
      socket.off("webrtc:screen_answer");
      socket.off("webrtc:screen_ice-candidate");
      socket.off("webrtc:screen_stopped");
    };
  }, [
    socket,
    isConnected,
    dispatch,
    createPeerConnection,
    currentUser,
    startLocalMedia,
    cleanup,
  ]);

  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current
        .getAudioTracks()
        .forEach((t) => (t.enabled = !isMuted));
    }
  }, [isMuted]);

  return {
    cleanup,
    startScreenShare,
    stopScreenShare,
    remoteStreams,
    remoteScreenStreams,
    localStream,
    localScreenStream,
    startLocalMedia,
  };
}
