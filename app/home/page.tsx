"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type User = {
  id: number;
  name: string;
  email: string;
  campus: string;
};

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
  seller_name: string;
  image_url: string | null;
};

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>(
    []
  );

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] =
    useState(true);
  const [error, setError] = useState("");

  async function loadProducts() {
    try {
      setProductsLoading(true);

      const response = await fetch(
        "/api/products",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/";
          return;
        }

        setError(
          data.message ||
            "Failed to load products"
        );

        return;
      }

      setProducts(data.products || []);
    } catch (error) {
      console.error(
        "Products loading error:",
        error
      );

      setError(
        "Something went wrong while loading products."
      );
    } finally {
      setProductsLoading(false);
    }
  }

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch(
          "/api/auth/me",
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          window.location.href = "/";
          return;
        }

        setUser(data.user);

        await loadProducts();
      } catch (error) {
        console.error(
          "User loading error:",
          error
        );

        window.location.href = "/";
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  async function handleLogout() {
    try {
      await fetch(
        "/api/auth/logout",
        {
          method: "POST",
        }
      );

      window.location.href = "/";
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }
  }

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        products.map(
          (product) => product.category
        )
      )
    );

    return ["All", ...uniqueCategories];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const searchTerm =
      search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !searchTerm ||
        product.name
          .toLowerCase()
          .includes(searchTerm) ||
        product.description
          ?.toLowerCase()
          .includes(searchTerm) ||
        product.category
          .toLowerCase()
          .includes(searchTerm);

      const matchesCategory =
        category === "All" ||
        product.category === category;

      return (
        matchesSearch &&
        matchesCategory
      );
    });
  }, [products, search, category]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">
          Loading Campzii...
        </p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/home"
            className="text-2xl font-bold text-gray-900"
          >
            Campzii
          </Link>

          <div className="flex items-center gap-5">
            <span className="text-sm text-gray-500">
              {user.campus}
            </span>

            <Link
              href="/chat"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Chats
            </Link>

            <Link
              href="/my-listings"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              My Listings
            </Link>

            <Link
              href="/sell"
              className="bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-800"
            >
              Sell Item
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="text-sm font-medium text-gray-500 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="mb-8">
          <p className="text-sm text-gray-500">
            Welcome back
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            {user.name}
          </h1>

          <p className="mt-2 text-gray-500">
            Browse items available at{" "}
            {user.campus}.
          </p>
        </div>

        {/* Search + filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4">
            <div>
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Search
              </label>

              <input
                id="search"
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search books, electronics, bags..."
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
              />
            </div>

            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Category
              </label>

              <select
                id="category"
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
              >
                {categories.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Section heading */}
        <div
          id="buy-items"
          className="flex items-center justify-between mb-5"
        >
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Buy Items
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Items listed by students on your campus.
            </p>
          </div>

          <span className="text-sm text-gray-500">
            {filteredProducts.length}{" "}
            {filteredProducts.length === 1
              ? "item"
              : "items"}
          </span>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {/* Products */}
        {productsLoading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <p className="text-gray-500">
              Loading products...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-2xl">
                🔍
              </span>
            </div>

            <h2 className="mt-5 text-xl font-semibold text-gray-900">
              No items found
            </h2>

            <p className="mt-2 text-gray-500">
              {search ||
              category !== "All"
                ? "Try changing your search or category filter."
                : "There are no available listings on your campus yet."}
            </p>

            {search ||
            category !== "All" ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                }}
                className="mt-5 bg-gray-900 text-white rounded-lg px-5 py-2.5 font-medium hover:bg-gray-800"
              >
                Clear Filters
              </button>
            ) : (
              <Link
                href="/sell"
                className="inline-block mt-5 bg-gray-900 text-white rounded-lg px-5 py-2.5 font-medium hover:bg-gray-800"
              >
                Sell the First Item
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(
              (product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Product image */}
                  <div className="h-52 bg-gray-100 overflow-hidden">
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

                  {/* Product information */}
                  <div className="p-5">
                    <p className="text-xs text-gray-500">
                      {product.category}
                    </p>

                    <h3 className="mt-1 text-lg font-semibold text-gray-900 line-clamp-2">
                      {product.name}
                    </h3>

                    <p className="mt-3 text-xl font-bold text-gray-900">
                      ₹{product.price}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {product.condition}
                    </p>

                    <p className="mt-3 text-sm text-gray-500">
                      Seller:{" "}
                      {product.seller_name}
                    </p>

                    <Link
                      href={`/product/${product.id}`}
                      className="block w-full mt-5 bg-gray-900 text-white rounded-lg py-2.5 text-center font-medium hover:bg-gray-800"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </main>
  );
}