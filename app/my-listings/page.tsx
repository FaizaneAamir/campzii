"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Product = {
  id: number;
  seller_id: number;
  name: string;
  description: string | null;
  price: number | string;
  category: string;
  condition: string;
  campus: string;
  status: string;
  created_at: string;
  image_url: string | null;
};

export default function MyListingsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function handleDelete(productId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this listing?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/products/${productId}/delete`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Failed to delete listing"
        );
        return;
      }

      setProducts((currentProducts) =>
        currentProducts.filter(
          (product) => product.id !== productId
        )
      );
    } catch (error) {
      console.error(
        "Delete listing error:",
        error
      );

      alert(
        "Something went wrong. Please try again."
      );
    }
  }

  async function handleMarkAsSold(
    productId: number
  ) {
    const confirmed = window.confirm(
      "Are you sure you want to mark this item as sold?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/products/${productId}/sold`,
        {
          method: "PUT",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Failed to mark item as sold"
        );
        return;
      }

      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === productId
            ? {
                ...product,
                status: "sold",
              }
            : product
        )
      );
    } catch (error) {
      console.error(
        "Mark as sold error:",
        error
      );

      alert(
        "Something went wrong. Please try again."
      );
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const response = await fetch(
          "/api/products/my",
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          if (response.status === 401) {
            window.location.href = "/";
            return;
          }

          setError(
            data.message ||
              "Failed to load your listings"
          );

          setLoading(false);
          return;
        }

        setProducts(data.products || []);
        setLoading(false);
      } catch (error) {
        if (!cancelled) {
          console.error(
            "My listings error:",
            error
          );

          setError(
            "Something went wrong. Please try again."
          );

          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">
          Loading your listings...
        </p>
      </main>
    );
  }

  const availableCount = products.filter(
    (product) =>
      product.status === "available"
  ).length;

  const soldCount = products.filter(
    (product) =>
      product.status === "sold"
  ).length;

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/home"
            className="text-2xl font-bold text-gray-900"
          >
            Campzii
          </Link>

          <div className="flex items-center gap-5">
            <Link
              href="/chat"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Chats
            </Link>

            <Link
              href="/sell"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Sell Item
            </Link>

            <Link
              href="/home"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              My Listings
            </h1>

            <p className="mt-2 text-gray-500">
              Manage the items you have listed
              on Campzii.
            </p>
          </div>

          <Link
            href="/sell"
            className="inline-flex items-center justify-center bg-gray-900 text-white rounded-lg px-5 py-3 font-medium hover:bg-gray-800"
          >
            + Sell New Item
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-700 rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {/* Listing Summary */}
        {products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">
                Total Listings
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-900">
                {products.length}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">
                Available
              </p>

              <p className="mt-1 text-2xl font-bold text-green-700">
                {availableCount}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">
                Sold
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-600">
                {soldCount}
              </p>
            </div>

          </div>
        )}

        {/* Empty State */}
        {products.length === 0 && !error ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">

            <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-2xl">
                📦
              </span>
            </div>

            <h2 className="mt-5 text-xl font-semibold text-gray-900">
              You haven&apos;t listed anything yet
            </h2>

            <p className="mt-2 text-gray-500">
              Sell your first item to students
              on your campus.
            </p>

            <Link
              href="/sell"
              className="inline-block mt-6 bg-gray-900 text-white rounded-lg px-6 py-3 font-medium hover:bg-gray-800"
            >
              Sell an Item
            </Link>

          </div>
        ) : (

          /* Listings */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {products.map((product) => {

              const isAvailable =
                product.status ===
                "available";

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
                >

                  {/* Image */}
                  <div className="h-48 bg-gray-100 overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400">
                          No Image
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-5">

                    {/* Category */}
                    <p className="text-xs text-gray-500">
                      {product.category}
                    </p>

                    {/* Name */}
                    <h2 className="mt-1 text-lg font-semibold text-gray-900 line-clamp-2">
                      {product.name}
                    </h2>

                    {/* Price */}
                    <p className="mt-3 text-xl font-bold text-gray-900">
                      ₹{product.price}
                    </p>

                    {/* Condition */}
                    <p className="mt-1 text-sm text-gray-500">
                      Condition:{" "}
                      {product.condition}
                    </p>

                    {/* Status */}
                    <div className="mt-4">

                      {isAvailable ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-green-50 text-green-700 px-3 py-1.5 text-xs font-semibold">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 text-gray-600 px-3 py-1.5 text-xs font-semibold">
                          <span className="w-2 h-2 rounded-full bg-gray-400" />
                          Sold
                        </span>
                      )}

                    </div>

                    {/* View / Edit */}
                    <div className="mt-4 grid grid-cols-2 gap-2">

                      {isAvailable ? (
                        <Link
                          href={`/product/${product.id}`}
                          className="bg-gray-900 text-white rounded-lg py-2.5 font-medium text-center hover:bg-gray-800"
                        >
                          View Listing
                        </Link>
                      ) : (
                        <div className="bg-gray-100 text-gray-500 rounded-lg py-2.5 font-medium text-center">
                          Sold
                        </div>
                      )}

                      {isAvailable ? (
                        <Link
                          href={`/product/${product.id}/edit`}
                          className="bg-white border border-gray-300 text-gray-700 rounded-lg py-2.5 font-medium text-center hover:bg-gray-50"
                        >
                          Edit
                        </Link>
                      ) : (
                        <div className="bg-gray-100 text-gray-400 rounded-lg py-2.5 font-medium text-center">
                          Edit Disabled
                        </div>
                      )}

                    </div>

                    {/* Mark Sold */}
                    {isAvailable && (
                      <button
                        type="button"
                        onClick={() =>
                          handleMarkAsSold(
                            product.id
                          )
                        }
                        className="w-full mt-2 bg-green-50 text-green-700 border border-green-200 rounded-lg py-2.5 font-medium hover:bg-green-100"
                      >
                        Mark as Sold
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(
                          product.id
                        )
                      }
                      className="w-full mt-2 bg-red-50 text-red-700 border border-red-200 rounded-lg py-2.5 font-medium hover:bg-red-100"
                    >
                      Delete
                    </button>

                  </div>
                </div>
              );
            })}

          </div>
        )}
      </div>
    </main>
  );
}