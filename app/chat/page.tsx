"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Conversation = {
  id: number;
  product_id: number;
  buyer_id: number;
  seller_id: number;
  status: string;
  created_at: string;
  product_name: string;
  product_price: string;
  buyer_name: string;
  seller_name: string;
  last_message: string | null;
  last_message_at: string | null;
};

type User = {
  id: number;
  name: string;
  email: string;
  campus: string;
};

export default function ChatListPage() {
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<
    Conversation[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const userResponse = await fetch("/api/auth/me");
        const userData = await userResponse.json();

        if (!userResponse.ok) {
          window.location.href = "/";
          return;
        }

        setUser(userData.user);

        const conversationResponse = await fetch(
          "/api/conversations"
        );

        const conversationData =
          await conversationResponse.json();

        if (!conversationResponse.ok) {
          setError(
            conversationData.message ||
              "Failed to load conversations"
          );
          return;
        }

        setConversations(
          conversationData.conversations || []
        );
      } catch (error) {
        console.error(
          "Conversation list error:",
          error
        );

        setError(
          "Something went wrong. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">
          Loading chats...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/home"
            className="text-2xl font-bold text-gray-900"
          >
            Campzii
          </Link>

          <Link
            href="/home"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-10">

        <div className="mb-8">
          <p className="text-sm text-gray-500">
            {user?.campus} Campus
          </p>

          <h1 className="text-3xl font-bold text-gray-900 mt-1">
            Your Chats
          </h1>

          <p className="text-gray-500 mt-2">
            Manage your conversations with other
            students.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {conversations.length === 0 && !error ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              No conversations yet
            </h2>

            <p className="mt-2 text-gray-500">
              Contact a seller from a product page to
              start a conversation.
            </p>

            <Link
              href="/home"
              className="inline-block mt-6 bg-gray-900 text-white rounded-lg px-6 py-3 font-medium hover:bg-gray-800"
            >
              Browse Items
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => {
              const isBuyer =
                conversation.buyer_id === user?.id;

              const otherPerson = isBuyer
                ? conversation.seller_name
                : conversation.buyer_name;

              return (
                <Link
                  key={conversation.id}
                  href={`/chat/${conversation.id}`}
                  className="block bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between gap-4">

                    <div className="min-w-0">

                      <div className="flex items-center gap-3">
                        <h2 className="font-semibold text-gray-900 truncate">
                          {conversation.product_name}
                        </h2>

                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {conversation.status}
                        </span>
                      </div>

                      <p className="text-sm text-gray-500 mt-1">
                        {isBuyer
                          ? `Seller: ${otherPerson}`
                          : `Buyer: ${otherPerson}`}
                      </p>

                      {conversation.last_message ? (
                        <p className="text-sm text-gray-600 mt-3 truncate">
                          {conversation.last_message}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 mt-3">
                          No messages yet
                        </p>
                      )}

                    </div>

                    <div className="text-right shrink-0">

                      <p className="font-semibold text-gray-900">
                        ₹{conversation.product_price}
                      </p>

                      {conversation.last_message_at && (
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(
                            conversation.last_message_at
                          ).toLocaleDateString()}
                        </p>
                      )}

                    </div>

                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}