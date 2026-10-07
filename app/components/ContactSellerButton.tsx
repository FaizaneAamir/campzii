"use client";

import { useState } from "react";

type Props = {
  productId: number;
};

export default function ContactSellerButton({ productId }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleContactSeller() {
    setLoading(true);

    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Could not start conversation");
        return;
      }

      window.location.href = `/chat/${data.conversation.id}`;
    } catch (error) {
      console.error("Conversation error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleContactSeller}
      disabled={loading}
      className="w-full mt-8 bg-gray-900 text-white rounded-lg py-3 font-medium hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? "Opening Chat..." : "Contact Seller"}
    </button>
  );
}