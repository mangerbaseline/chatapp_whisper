"use client";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  endCall,
  acceptCall,
  toggleMute,
} from "@/redux/features/chat/callSlice";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useSocket } from "@/components/SocketProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Maximize2,
  Minimize2,
  MonitorUp,
  MonitorX,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useState, useEffect, useRef } from "react";

export function CallOverlay() {
  const dispatch = useAppDispatch();
  const { socket } = useSocket();
  const { status, partner, isMuted, isVideo, errorMessage, isScreenSharing } =
    useAppSelector((state) => state.call);
  const currentUser = useAppSelector((state) => state.auth.user);
  const {
    remoteAudioRef,
    localVideoRef,
    remoteVideoRef,
    cleanup,
    startScreenShare,
    stopScreenShare,
  } = useWebRTC();
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const ringAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (status === "receiving") {
      const audio = new Audio("/ring.mp3");
      audio.loop = true;
      audio.volume = 0.8;
      audio.play().catch(() => {});
      ringAudioRef.current = audio;
    } else {
      if (ringAudioRef.current) {
        ringAudioRef.current.pause();
        ringAudioRef.current.currentTime = 0;
        ringAudioRef.current = null;
      }
    }

    return () => {
      if (ringAudioRef.current) {
        ringAudioRef.current.pause();
        ringAudioRef.current.currentTime = 0;
        ringAudioRef.current = null;
      }
    };
  }, [status]);

  if (status === "idle") return null;

  const handleEndCall = () => {
    if (socket && partner?.id) {
      socket.emit("call:end", { to: partner.id });
    }
    cleanup();
    dispatch(endCall());
  };

  const handleAcceptCall = () => {
    if (socket && partner?.id) {
      socket.emit("call:accept", {
        callerId: partner.id,
        receiverInfo: {
          name: currentUser?.firstName || currentUser?.email || "User",
          image: currentUser?.image,
        },
      });
      dispatch(acceptCall());
    }
  };

  const handleRejectCall = () => {
    if (socket && partner?.id) {
      socket.emit("call:reject", { callerId: partner.id });
    }
    dispatch(endCall());
  };

  const toggleCamera = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach((track) => {
        track.enabled = isCameraOff;
      });
      setIsCameraOff(!isCameraOff);
    }
  };

  const toggleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300 ${isFullScreen ? "p-0" : "p-4"}`}
    >
      {!isVideo && <audio ref={remoteAudioRef} autoPlay playsInline />}

      <Card
        className={`relative w-full overflow-hidden shadow-2xl bg-card/95 border-primary/20 flex flex-col items-center justify-center transition-all duration-300 ${isFullScreen ? "h-full max-w-none rounded-none" : "max-w-2xl aspect-video rounded-3xl"}`}
      >
        {/* Remote Video Stream */}
        {isVideo && status === "ongoing" && (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`absolute inset-0 w-full h-full bg-black ${isScreenSharing ? "object-contain" : "object-cover"}`}
          />
        )}

        {/* Local Video Stream (Picture-in-Picture) */}
        {isVideo && (status === "ongoing" || status === "calling") && (
          <div className="absolute top-4 right-4 w-32 md:w-48 h-48 aspect-video rounded-xl overflow-hidden border-2 border-primary/20 bg-black shadow-lg z-10 transition-transform active:scale-95 cursor-move">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full ${isScreenSharing ? "object-contain" : "object-cover"} ${isCameraOff && !isScreenSharing ? "hidden" : ""}`}
            />
            {isCameraOff && (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <VideoOff className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
        )}

        {/* User Info Overlay (when no video or status is calling/receiving) */}
        {(!isVideo || status !== "ongoing") && (
          <div className="flex flex-col items-center gap-6 z-0">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-primary/10 shadow-xl">
                <AvatarImage src={partner?.image} alt={partner?.name} />
                <AvatarFallback className="text-4xl bg-primary/5 text-primary">
                  {partner?.name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {(status === "calling" || status === "receiving") && (
                <div className="absolute inset-0 rounded-full border-4 border-primary animate-ping opacity-20" />
              )}
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold tracking-tight">
                {partner?.name}
              </h3>
              <p className="text-sm text-muted-foreground font-semibold uppercase tracking-[0.2em] animate-pulse">
                {status === "calling"
                  ? "Calling..."
                  : status === "receiving"
                    ? isVideo
                      ? "Incoming Video Call"
                      : "Incoming Voice Call"
                    : status === "ongoing"
                      ? "On Call"
                      : errorMessage || "Ended"}
              </p>
            </div>
          </div>
        )}

        {/* Controls Overlay */}
        <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4 z-20 px-8">
          <div className="flex items-center gap-4 bg-black/40 backdrop-blur-xl p-4 rounded-full border border-white/10 shadow-2xl">
            {status === "receiving" ? (
              <>
                <Button
                  onClick={handleAcceptCall}
                  size="lg"
                  className="rounded-full h-16 w-16 bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20 group"
                >
                  {isVideo ? (
                    <Video className="h-7 w-7 group-hover:scale-110 transition-transform" />
                  ) : (
                    <Phone className="h-7 w-7 group-hover:scale-110 transition-transform" />
                  )}
                </Button>
                <Button
                  onClick={handleRejectCall}
                  variant="destructive"
                  size="lg"
                  className="rounded-full h-16 w-16 shadow-lg shadow-destructive/20 group"
                >
                  <PhoneOff className="h-7 w-7 group-hover:scale-110 transition-transform" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => dispatch(toggleMute())}
                  variant="outline"
                  size="icon"
                  className={`rounded-full h-12 w-12 border-white/10 hover:bg-white/10 transition-colors ${isMuted ? "bg-destructive/20 text-destructive border-destructive/40 hover:bg-destructive/30" : "bg-white/5 text-white"}`}
                >
                  {isMuted ? (
                    <MicOff className="h-5 w-5" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </Button>

                {isVideo && (
                  <Button
                    onClick={toggleCamera}
                    variant="outline"
                    size="icon"
                    className={`rounded-full h-12 w-12 border-white/10 hover:bg-white/10 transition-colors ${isCameraOff ? "bg-destructive/20 text-destructive border-destructive/40 hover:bg-destructive/30" : "bg-white/5 text-white"}`}
                  >
                    {isCameraOff ? (
                      <VideoOff className="h-5 w-5" />
                    ) : (
                      <Video className="h-5 w-5" />
                    )}
                  </Button>
                )}

                {isVideo && (
                  <Button
                    onClick={toggleScreenShare}
                    variant="outline"
                    size="icon"
                    className={`rounded-full h-12 w-12 border-white/10 hover:bg-white/10 transition-colors ${
                      isScreenSharing
                        ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                        : "bg-white/5 text-white"
                    }`}
                  >
                    {isScreenSharing ? (
                      <MonitorX className="h-5 w-5" />
                    ) : (
                      <MonitorUp className="h-5 w-5" />
                    )}
                  </Button>
                )}

                <Button
                  onClick={handleEndCall}
                  variant="destructive"
                  size="lg"
                  className="rounded-full h-14 w-14 shadow-lg shadow-destructive/20 group"
                >
                  <PhoneOff className="h-6 w-6 group-hover:scale-110 transition-transform" />
                </Button>

                {isVideo && (
                  <Button
                    onClick={() => setIsFullScreen(!isFullScreen)}
                    variant="outline"
                    size="icon"
                    className="rounded-full h-12 w-12 border-white/10 bg-white/5 text-white hover:bg-white/10"
                  >
                    {isFullScreen ? (
                      <Minimize2 className="h-5 w-5" />
                    ) : (
                      <Maximize2 className="h-5 w-5" />
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-destructive/90 text-destructive-foreground rounded-full text-sm font-medium shadow-lg animate-in slide-in-from-top-4">
            {errorMessage}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch(endCall())}
              className="ml-2 h-auto p-0 text-destructive-foreground hover:bg-transparent underline"
            >
              Dismiss
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
