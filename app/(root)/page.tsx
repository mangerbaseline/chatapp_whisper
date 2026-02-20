"use client";

import ChatWindow from "@/components/chat/ChatWindow";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

export default function MessagesPage() {
  const selectedConversationId = useSelector(
    (state: RootState) => state.chat.selectedConversationId,
  );

  return (
    <div className="flex-1 flex flex-col md:min-h-min h-full relative overflow-hidden">
      {selectedConversationId ? (
        <ChatWindow conversationId={selectedConversationId} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col gap-4">
          <div className="bg-muted p-6 rounded-full">
            <svg
              className="w-12 h-12 text-muted-foreground/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <p className="text-lg font-medium">
            Select a conversation to start messaging
          </p>
          <p className="text-sm text-muted-foreground max-w-sm text-center">
            Choose a contact from the sidebar or start a new chat to begin
            communicating.
          </p>
        </div>
      )}
    </div>
  );
}
