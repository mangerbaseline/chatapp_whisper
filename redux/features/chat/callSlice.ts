import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type CallStatus =
  | "idle"
  | "calling"
  | "receiving"
  | "ongoing"
  | "ended"
  | "error";

export interface Participant {
  id: string;
  name: string;
  image?: string;
  isJoined?: boolean;
}

interface CallState {
  status: CallStatus;
  conversationId: string | null;
  participants: Participant[];
  isGroup: boolean;
  isMuted: boolean;
  isVideo: boolean;
  errorMessage: string | null;
  isScreenSharing: boolean;
  activeMainView: "local" | "remote" | "screen" | string;
  remoteScreenTrackId: string | null;
}

const initialState: CallState = {
  status: "idle",
  conversationId: null,
  participants: [],
  isGroup: false,
  isMuted: false,
  isVideo: false,
  errorMessage: null,
  isScreenSharing: false,
  activeMainView: "remote",
  remoteScreenTrackId: null,
};

const callSlice = createSlice({
  name: "call",
  initialState,
  reducers: {
    initiateCall: (
      state,
      action: PayloadAction<{
        conversationId: string;
        participants: Participant[];
        isGroup: boolean;
        isVideo?: boolean;
      }>,
    ) => {
      state.status = "calling";
      state.conversationId = action.payload.conversationId;
      state.participants = action.payload.participants;
      state.isGroup = action.payload.isGroup;
      state.isVideo = !!action.payload.isVideo;
      state.errorMessage = null;
    },
    incomingCall: (
      state,
      action: PayloadAction<{
        conversationId: string;
        participants: Participant[];
        isGroup: boolean;
        isVideo?: boolean;
      }>,
    ) => {
      state.status = "receiving";
      state.conversationId = action.payload.conversationId;
      state.participants = action.payload.participants;
      state.isGroup = action.payload.isGroup;
      state.isVideo = !!action.payload.isVideo;
    },
    acceptCall: (state) => {
      state.status = "ongoing";
    },
    addParticipant: (state, action: PayloadAction<Participant>) => {
      const exists = state.participants.find((p) => p.id === action.payload.id);
      if (!exists) {
        state.participants.push(action.payload);
      }
    },
    removeParticipant: (state, action: PayloadAction<string>) => {
      state.participants = state.participants.filter(
        (p) => p.id !== action.payload,
      );
      // End the call immediately if no more participants are left
      if (state.participants.length === 0 && state.status === "ongoing") {
        state.status = "idle";
        state.conversationId = null;
        state.participants = [];
      }
    },
    setParticipantJoined: (
      state,
      action: PayloadAction<{ id: string; joined: boolean }>,
    ) => {
      const participant = state.participants.find(
        (p) => p.id === action.payload.id,
      );
      if (participant) {
        participant.isJoined = action.payload.joined;
      }
    },
    endCall: (state) => {
      state.status = "idle";
      state.conversationId = null;
      state.participants = [];
      state.isGroup = false;
      state.isMuted = false;
      state.isVideo = false;
      state.isScreenSharing = false;
      state.activeMainView = "remote";
      state.remoteScreenTrackId = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.status = "error";
      state.errorMessage = action.payload;
    },
    setWarning: (state, action: PayloadAction<string>) => {
      state.errorMessage = action.payload;
    },
    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
    },
    setScreenSharing: (state, action: PayloadAction<boolean>) => {
      state.isScreenSharing = action.payload;
    },
    setActiveMainView: (
      state,
      action: PayloadAction<"local" | "remote" | "screen" | string>,
    ) => {
      state.activeMainView = action.payload;
    },
    setRemoteScreenTrackId: (state, action: PayloadAction<string | null>) => {
      state.remoteScreenTrackId = action.payload;
      if (action.payload) {
        state.activeMainView = "screen";
      } else if (state.activeMainView === "screen") {
        state.activeMainView = "remote";
      }
    },
  },
});

export const {
  initiateCall,
  incomingCall,
  acceptCall,
  addParticipant,
  removeParticipant,
  setParticipantJoined,
  endCall,
  setError,
  setWarning,
  toggleMute,
  setScreenSharing,
  setActiveMainView,
  setRemoteScreenTrackId,
} = callSlice.actions;
export default callSlice.reducer;
