"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Conversation = {
  id: number;
  product_id: number;
  buyer_id: number;
  seller_id: number;
  status: string;
  created_at: string;
  product_name: string;
  product_price: string;
  product_status: string;
  buyer_name: string;
  seller_name: string;
};

type Message = {
  id: number;
  conversation_id: number;
  sender_id: number;
  message: string;
  created_at: string;
  sender_name: string;
};

export default function ChatPage() {
  const params = useParams();
  const conversationId = params.id;

  const [conversation, setConversation] =
    useState<Conversation | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] =
    useState<number | null>(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function loadConversation() {
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}`
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/";
          return;
        }

        setError(
          data.message || "Failed to load conversation"
        );
        return;
      }

      setConversation(data.conversation);
      setCurrentUserId(data.currentUserId);
    } catch (error) {
      console.error(
        "Conversation loading error:",
        error
      );

      setError(
        "Something went wrong while loading the chat."
      );
    }
  }

  async function loadMessages() {
    try {
      const response = await fetch(
        `/api/messages?conversationId=${conversationId}`
      );

      const data = await response.json();

      if (!response.ok) {
        return;
      }

      setMessages(data.messages || []);
    } catch (error) {
      console.error(
        "Messages loading error:",
        error
      );
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadChat() {
      await loadConversation();
      await loadMessages();

      if (!cancelled) {
        setLoading(false);
      }
    }

    loadChat();

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadMessages();
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [conversationId]);

  async function handleSendMessage(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!message.trim() || sending) {
      return;
    }

    setSending(true);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: Number(conversationId),
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message || "Failed to send message"
        );

        // Refresh conversation in case the product
        // was marked as sold.
        await loadConversation();

        return;
      }

      setMessage("");

      await loadMessages();
    } catch (error) {
      console.error(
        "Send message error:",
        error
      );

      alert(
        "Something went wrong. Please try again."
      );
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">
          Loading chat...
        </p>
      </main>
    );
  }

  if (error || !conversation) {
    return (
      <main className="min-h-screen bg-gray-100">
        <nav className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <Link
              href="/chat"
              className="text-2xl font-bold text-gray-900"
            >
              Campzii
            </Link>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Unable to open chat
            </h1>

            <p className="mt-2 text-gray-500">
              {error || "Conversation not found."}
            </p>

            <Link
              href="/chat"
              className="inline-block mt-6 bg-gray-900 text-white rounded-lg px-6 py-3 font-medium hover:bg-gray-800"
            >
              Back to Chats
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isSold =
    conversation.product_status !== "available";

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col">
      <nav className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/home"
            className="text-2xl font-bold text-gray-900"
          >
            Campzii
          </Link>

          <Link
            href="/chat"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Back to Chats
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl w-full mx-auto px-6 py-6 flex-1 flex flex-col">
        {/* Product header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500">
                Product
              </p>

              <h1 className="mt-1 text-xl font-semibold text-gray-900">
                {conversation.product_name}
              </h1>

              <p className="mt-1 text-gray-600">
                ₹{conversation.product_price}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isSold ? (
                <span className="rounded-full bg-gray-100 text-gray-600 px-3 py-1 text-xs font-medium">
                  Sold
                </span>
              ) : (
                <span className="rounded-full bg-green-50 text-green-700 px-3 py-1 text-xs font-medium">
                  Available
                </span>
              )}

              <Link
                href={`/product/${conversation.product_id}`}
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                View Product
              </Link>
            </div>
          </div>
        </div>

        {/* Sold notice */}
        {isSold && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 mb-4">
            <p className="font-medium text-gray-800">
              This item has been sold.
            </p>

            <p className="mt-1 text-sm text-gray-500">
              This conversation is now closed for new
              messages. Your previous messages are still
              available.
            </p>
          </div>
        )}

        {/* Chat */}
        <div className="bg-white rounded-2xl border border-gray-200 flex-1 flex flex-col min-h-[500px]">
          <div className="px-5 py-4 border-b">
            <p className="text-sm text-gray-500">
              {currentUserId === conversation.buyer_id
                ? `Chat with ${conversation.seller_name}`
                : `Chat with ${conversation.buyer_name}`}
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-400">
                  No messages yet. Start the conversation.
                </p>
              </div>
            ) : (
              messages.map((item) => {
                const isMine =
                  item.sender_id === currentUserId;

                return (
                  <div
                    key={item.id}
                    className={`flex ${
                      isMine
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                        isMine
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {item.message}
                      </p>

                      <p
                        className={`mt-1 text-[11px] ${
                          isMine
                            ? "text-gray-300"
                            : "text-gray-500"
                        }`}
                      >
                        {new Date(
                          item.created_at
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message input */}
          {!isSold ? (
            <form
              onSubmit={handleSendMessage}
              className="border-t p-4 flex gap-3"
            >
              <input
                type="text"
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                placeholder="Type a message..."
                disabled={sending}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100"
              />

              <button
                type="submit"
                disabled={
                  sending || !message.trim()
                }
                className="rounded-lg bg-gray-900 text-white px-5 py-3 font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </form>
          ) : (
            <div className="border-t px-5 py-4 text-center">
              <p className="text-sm text-gray-500">
                Messaging is disabled because this item
                has been sold.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}