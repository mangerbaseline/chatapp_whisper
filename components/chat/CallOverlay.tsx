"use client";

import { useState, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  endCall,
  acceptCall,
  toggleMute,
  setActiveMainView,
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
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Card } from "@/components/ui/card";

export function CallOverlay() {
  const dispatch = useAppDispatch();
  const { socket } = useSocket();
  const {
    status,
    partner,
    isMuted,
    isVideo,
    errorMessage,
    isScreenSharing,
    activeMainView,
    remoteScreenTrackId,
  } = useAppSelector((state) => state.call);
  const currentUser = useAppSelector((state: any) => state.auth.user);
  const {
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
  } = useWebRTC();

  const [isCameraOff, setIsCameraOff] = useState(false);
  const showLocalAvatar =
    isCameraOff || !localStream || localStream.getVideoTracks().length === 0;
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showPipTray, setShowPipTray] = useState(true);
  const ringAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteScreenRef = useRef<HTMLVideoElement | null>(null);

  const isScreenShareSupported =
    typeof navigator !== "undefined" &&
    "mediaDevices" in navigator &&
    "getDisplayMedia" in navigator.mediaDevices;

  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [hasRemoteScreen, setHasRemoteScreen] = useState(false);

  useEffect(() => {
    if (remoteStream) {
      const checkRemoteVideo = () => {
        const cameraTrack = remoteStream.getVideoTracks()[0];
        if (cameraTrack) {
          setHasRemoteVideo(cameraTrack.readyState === "live");
        } else {
          setHasRemoteVideo(false);
        }
      };

      checkRemoteVideo();
      remoteStream.addEventListener("addtrack", checkRemoteVideo);
      remoteStream.addEventListener("removetrack", checkRemoteVideo);

      const tracks = remoteStream.getVideoTracks();
      tracks.forEach((track) => {
        track.addEventListener("mute", checkRemoteVideo);
        track.addEventListener("unmute", checkRemoteVideo);
        track.addEventListener("ended", checkRemoteVideo);
      });

      return () => {
        remoteStream.removeEventListener("addtrack", checkRemoteVideo);
        remoteStream.removeEventListener("removetrack", checkRemoteVideo);
        tracks.forEach((track) => {
          track.removeEventListener("mute", checkRemoteVideo);
          track.removeEventListener("unmute", checkRemoteVideo);
          track.removeEventListener("ended", checkRemoteVideo);
        });
      };
    } else {
      setHasRemoteVideo(false);
    }
  }, [remoteStream, status]);

  // Monitor Remote Screen Stream Tracks
  useEffect(() => {
    if (remoteScreenStream) {
      const checkRemoteScreen = () => {
        const screenTrack = remoteScreenStream.getVideoTracks()[0];
        if (screenTrack) {
          setHasRemoteScreen(screenTrack.readyState === "live");
        } else {
          setHasRemoteScreen(false);
        }
      };

      checkRemoteScreen();
      remoteScreenStream.addEventListener("addtrack", checkRemoteScreen);
      remoteScreenStream.addEventListener("removetrack", checkRemoteScreen);

      const tracks = remoteScreenStream.getVideoTracks();
      tracks.forEach((track) => {
        track.addEventListener("mute", checkRemoteScreen);
        track.addEventListener("unmute", checkRemoteScreen);
        track.addEventListener("ended", checkRemoteScreen);
      });

      return () => {
        remoteScreenStream.removeEventListener("addtrack", checkRemoteScreen);
        remoteScreenStream.removeEventListener(
          "removetrack",
          checkRemoteScreen,
        );
        tracks.forEach((track) => {
          track.removeEventListener("mute", checkRemoteScreen);
          track.removeEventListener("unmute", checkRemoteScreen);
          track.removeEventListener("ended", checkRemoteScreen);
        });
      };
    } else {
      setHasRemoteScreen(false);
    }
  }, [remoteScreenStream, status]);

  // Audio Notifications
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
    if (socket && partner?.id) socket.emit("call:end", { to: partner.id });
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
    if (socket && partner?.id)
      socket.emit("call:reject", { callerId: partner.id });
    dispatch(endCall());
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = isCameraOff;
      });
      setIsCameraOff(!isCameraOff);
    }
  };

  const toggleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenShare();
      if (activeMainView === "screen") dispatch(setActiveMainView("remote"));
    } else {
      startScreenShare();
      dispatch(setActiveMainView("screen"));
    }
  };

  // Determines which view should be large in the background
  const renderMainView = () => {
    if (activeMainView === "screen") {
      if (isScreenSharing) {
        return (
          <video
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full bg-gray-100 object-contain"
            ref={(el) => {
              if (el && localScreenStream) el.srcObject = localScreenStream;
            }}
          />
        );
      } else if (hasRemoteScreen) {
        return (
          <video
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full bg-gray-100 object-contain"
            ref={(el) => {
              if (el && el.srcObject !== remoteScreenStream)
                el.srcObject = remoteScreenStream;
            }}
          />
        );
      }
    }

    if (activeMainView === "local") {
      return (
        <div className="relative w-full h-full flex items-center justify-center bg-gray-100">
          <video
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-contain ${showLocalAvatar ? "hidden" : ""}`}
            ref={(el) => {
              if (el && el.srcObject !== localStream)
                el.srcObject = localStream;
            }}
          />
          {showLocalAvatar && (
            <AvatarFallbackUI
              name={currentUser?.firstName || "You"}
              image={currentUser?.image}
            />
          )}
        </div>
      );
    }

    // Default 'remote'
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-gray-100">
        <video
          autoPlay
          playsInline
          className={`absolute inset-0 w-full h-full object-contain ${!hasRemoteVideo ? "hidden" : ""}`}
          ref={(el) => {
            if (el && el.srcObject !== remoteStream)
              el.srcObject = remoteStream;
          }}
        />
        {!hasRemoteVideo && (
          <AvatarFallbackUI name={partner?.name} image={partner?.image} />
        )}
      </div>
    );
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-md animate-in fade-in duration-300 ${isFullScreen ? "p-0" : "p-4"}`}
    >
      {!isVideo && <audio ref={remoteAudioRef} autoPlay playsInline />}

      <Card
        className={`relative w-full overflow-hidden shadow-2xl bg-white border-gray-200 flex flex-col items-center justify-center transition-all duration-300 ${isFullScreen ? "h-full max-w-none rounded-none" : "max-w-4xl aspect-video rounded-3xl"}`}
      >
        {/* Render Background / Main View */}
        {isVideo && status === "ongoing" && renderMainView()}

        {/* Generic Outgoing / Incoming Call View without Video */}
        {(!isVideo || status !== "ongoing") && (
          <div className="flex flex-col items-center gap-6 z-0">
            <AvatarFallbackUI name={partner?.name} image={partner?.image} />
            <div className="text-center space-y-2 text-gray-800">
              <h3 className="text-2xl font-bold tracking-tight">
                {partner?.name}
              </h3>
              <p className="text-sm text-gray-500 font-semibold uppercase tracking-[0.2em] animate-pulse">
                {status === "calling"
                  ? "Calling..."
                  : status === "receiving"
                    ? isVideo
                      ? "Incoming Video Call"
                      : "Incoming Voice Call"
                    : status === "ongoing"
                      ? "On Call"
                      : "Ended"}
              </p>
            </div>
          </div>
        )}

        {/* Floating PIP Tray Selector */}
        {isVideo && status === "ongoing" && (
          <div
            className={`absolute right-4 top-4 z-40 flex flex-col items-end gap-2 transition-transform duration-300 ${showPipTray ? "translate-x-0" : "translate-x-[120%]"}`}
          >
            <Button
              onClick={() => setShowPipTray(!showPipTray)}
              variant="secondary"
              size="icon"
              className="absolute -left-12 top-0 h-8 w-8 rounded-full bg-white/80 hover:bg-gray-100 text-gray-700 border border-gray-200 backdrop-blur-sm shadow-sm"
            >
              {showPipTray ? (
                <ChevronDown className="rotate-90" />
              ) : (
                <ChevronUp className="-rotate-90" />
              )}
            </Button>

            <div className="bg-white/80 backdrop-blur-xl border border-gray-200 p-2 rounded-2xl flex flex-col gap-3 shadow-xl">
              {/* Remote Camera PIP */}
              {activeMainView !== "remote" && (
                <div
                  onClick={() => dispatch(setActiveMainView("remote"))}
                  className="relative w-32 aspect-video rounded-xl bg-gray-100 border-2 border-transparent hover:border-primary/50 cursor-pointer overflow-hidden transition-colors shadow-md group"
                >
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-0 group-hover:opacity-100 bg-white/60 transition-opacity">
                    <span className="text-xs text-gray-800 font-semibold">
                      View Partner
                    </span>
                  </div>
                  <video
                    autoPlay
                    playsInline
                    className={`absolute inset-0 w-full h-full object-cover ${!hasRemoteVideo ? "hidden" : ""}`}
                    ref={(el) => {
                      if (el && el.srcObject !== remoteStream)
                        el.srcObject = remoteStream;
                    }}
                  />
                  {!hasRemoteVideo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      <AvatarFallbackUI
                        name={partner?.name}
                        image={partner?.image}
                        size="small"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Local Camera PIP */}
              {activeMainView !== "local" && (
                <div
                  onClick={() => dispatch(setActiveMainView("local"))}
                  className="relative w-32 aspect-video rounded-xl bg-gray-100 border-2 border-transparent hover:border-primary/50 cursor-pointer overflow-hidden transition-colors shadow-md group"
                >
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-0 group-hover:opacity-100 bg-white/60 transition-opacity">
                    <span className="text-xs text-gray-800 font-semibold">
                      View You
                    </span>
                  </div>
                  <video
                    autoPlay
                    playsInline
                    muted
                    className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${showLocalAvatar ? "hidden" : ""}`}
                    ref={(el) => {
                      if (el && el.srcObject !== localStream)
                        el.srcObject = localStream;
                    }}
                  />
                  {showLocalAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      <AvatarFallbackUI
                        name={currentUser?.firstName || "You"}
                        image={currentUser?.image}
                        size="small"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Screen Share PIP (If currently active and not main view) */}
              {(isScreenSharing || hasRemoteScreen) &&
                activeMainView !== "screen" && (
                  <div
                    onClick={() => dispatch(setActiveMainView("screen"))}
                    className="relative w-32 aspect-video rounded-xl bg-primary/20 border-2 border-primary/50 cursor-pointer overflow-hidden transition-colors shadow-lg group flex items-center justify-center"
                  >
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-0 group-hover:opacity-100 bg-white/60 transition-opacity">
                      <span className="text-xs text-gray-800 font-semibold">
                        View Screen
                      </span>
                    </div>
                    {hasRemoteScreen && (
                      <video
                        autoPlay
                        playsInline
                        className="w-full h-full object-contain"
                        ref={(el) => {
                          if (el && el.srcObject !== remoteScreenStream)
                            el.srcObject = remoteScreenStream;
                        }}
                      />
                    )}
                    {isScreenSharing && (
                      <video
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-contain"
                        ref={(el) => {
                          if (el && localScreenStream)
                            el.srcObject = localScreenStream;
                        }}
                      />
                    )}
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Controls Overlay */}
        <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4 z-20 px-8">
          <div className="flex items-center gap-4 bg-white/80 backdrop-blur-xl p-4 rounded-full border border-gray-200 shadow-xl">
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
                  className={`rounded-full h-12 w-12 border-gray-200 transition-colors ${isMuted ? "bg-destructive/20 text-destructive border-destructive/40 hover:bg-destructive/30" : "hover:bg-gray-100 bg-white text-gray-700"}`}
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
                    className={`rounded-full h-12 w-12 border-gray-200 transition-colors ${isCameraOff ? "bg-destructive/20 text-destructive border-destructive/40 hover:bg-destructive/30" : "hover:bg-gray-100 bg-white text-gray-700"}`}
                  >
                    {isCameraOff ? (
                      <VideoOff className="h-5 w-5" />
                    ) : (
                      <Video className="h-5 w-5" />
                    )}
                  </Button>
                )}

                {isVideo && isScreenShareSupported && (
                  <Button
                    onClick={toggleScreenShare}
                    variant="outline"
                    size="icon"
                    className={`rounded-full h-12 w-12 border-gray-200 transition-colors ${isScreenSharing ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90" : "hover:bg-gray-100 bg-white text-gray-700"}`}
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
                    className="rounded-full h-12 w-12 border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
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
          <div className="absolute top-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-destructive/90 text-destructive-foreground rounded-full text-sm font-medium shadow-lg animate-in slide-in-from-top-4 z-50 flex items-center gap-2">
            <span>{errorMessage}</span>
          </div>
        )}
      </Card>
    </div>
  );
}

// Helper UI Component for Avatar
function AvatarFallbackUI({
  name,
  image,
  size = "large",
}: {
  name?: string;
  image?: string;
  size?: "small" | "large";
}) {
  const isSmall = size === "small";
  const dimClass = isSmall ? "h-14 w-14" : "h-32 w-32";
  const textClass = isSmall ? "text-xl" : "text-4xl";
  const borderClass = isSmall ? "border-2" : "border-4";

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <Avatar
        className={`${dimClass} ${borderClass} border-primary/10 shadow-xl`}
      >
        <AvatarImage src={image} alt={name} />
        <AvatarFallback className={`${textClass} bg-primary/5 text-primary`}>
          {name?.[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}
