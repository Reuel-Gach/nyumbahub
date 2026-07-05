"use client";

import React, { useState, useEffect, useRef } from "react";
import { getTourMessages, sendTourMessage, markTourMessagesAsRead } from "../lib/actions/messages";

// TypeScript interfaces for our data
interface Message {
  id: string;
  content: string;
  createdAt: Date;
  senderId: string;
  senderName: string | null;
}

interface TourChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourId: string;
  propertyTitle: string;
  tourDate: Date | string;
  status: string;
  currentUserId: string; // To determine if a message is "mine" or "theirs"
}

export default function TourChatModal({
  isOpen,
  onClose,
  tourId,
  propertyTitle,
  tourDate,
  status,
  currentUserId,
}: TourChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom of the chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch messages when the modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      markTourMessagesAsRead(tourId).catch(console.error);
      getTourMessages(tourId)
        .then((data) => {
          setMessages(data as Message[]);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load messages", err);
          setIsLoading(false);
        });
    }
  }, [isOpen, tourId]);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle sending a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    const contentToSend = newMessage.trim();
    
    // Optimistic UI update: Add message to screen instantly before server confirms
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: contentToSend,
      createdAt: new Date(),
      senderId: currentUserId,
      senderName: "Me",
    };
    
    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage(""); // Clear input

    try {
      await sendTourMessage(tourId, contentToSend);
      // Optional: You could re-fetch messages here to guarantee sync, 
      // but Next.js revalidatePath usually handles the server-side cache.
    } catch (error) {
      console.error("Failed to send message", error);
      // In a production app, you'd show a toast error and remove the optimistic message
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  // Format the date safely
  const formattedDate = new Date(tourDate).toLocaleDateString("en-KE", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      {/* Modal Container */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col h-[85vh] sm:h-[600px] overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800 text-lg line-clamp-1">{propertyTitle}</h3>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              📅 {formattedDate} • <span className="capitalize">{status}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Chat Body */}
        <div className="flex-grow overflow-y-auto p-6 bg-slate-50/50">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <span className="text-4xl mb-3">💬</span>
              <p className="text-slate-500 font-medium">No messages yet.</p>
              <p className="text-sm text-slate-400 mt-1">Start the conversation to discuss tour details!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const isMine = msg.senderId === currentUserId;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                    <div className="flex items-baseline gap-2 mb-1 px-1">
                      <span className="text-xs font-semibold text-slate-500">
                        {isMine ? "You" : msg.senderName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(msg.createdAt).toLocaleTimeString("en-KE", { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div 
                      className={`px-4 py-2.5 rounded-2xl max-w-[85%] sm:max-w-[75%] text-sm shadow-sm ${
                        isMine 
                          ? "bg-blue-600 text-white rounded-tr-sm" 
                          : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              {/* Invisible div to scroll to */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Footer */}
        <div className="bg-white border-t border-slate-200 p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-grow bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl px-4 py-2.5 flex items-center justify-center transition-colors shadow-sm"
            >
              <svg className="w-5 h-5 translate-x-px -translate-y-px" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
              </svg>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}