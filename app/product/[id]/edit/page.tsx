"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: number | string;
  category: string;
  condition: string;
  status: string;
};

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();

  const productId = params.id;

  const [product, setProduct] =
    useState<Product | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] =
    useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] =
    useState("");
  const [condition, setCondition] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadProduct() {
      try {
        const response = await fetch(
          `/api/products/${productId}`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setError(
            data.message ||
              "Failed to load listing"
          );
          setLoading(false);
          return;
        }

        const loadedProduct =
          data.product;

        setProduct(loadedProduct);

        setName(loadedProduct.name);
        setDescription(
          loadedProduct.description || ""
        );
        setPrice(
          String(loadedProduct.price)
        );
        setCategory(
          loadedProduct.category
        );
        setCondition(
          loadedProduct.condition
        );

        setLoading(false);
      } catch (error) {
        console.error(
          "Load product error:",
          error
        );

        setError(
          "Something went wrong. Please try again."
        );

        setLoading(false);
      }
    }

    loadProduct();
  }, [productId]);

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError("");
    setSaving(true);

    try {
      const response = await fetch(
        `/api/products/${productId}/edit`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name,
            description,
            price: Number(price),
            category,
            condition,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Failed to update listing"
        );
        setSaving(false);
        return;
      }

      alert(
        "Listing updated successfully"
      );

      router.push("/my-listings");
    } catch (error) {
      console.error(
        "Update product error:",
        error
      );

      setError(
        "Something went wrong. Please try again."
      );

      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">
          Loading listing...
        </p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-gray-100">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">

            <h1 className="text-2xl font-bold text-gray-900">
              Listing not found
            </h1>

            <p className="mt-2 text-gray-500">
              {error ||
                "This listing could not be found."}
            </p>

            <Link
              href="/my-listings"
              className="inline-block mt-6 bg-gray-900 text-white rounded-lg px-6 py-3 font-medium hover:bg-gray-800"
            >
              Back to My Listings
            </Link>

          </div>
        </div>
      </main>
    );
  }

  if (product.status !== "available") {
    return (
      <main className="min-h-screen bg-gray-100">

        <nav className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <Link
              href="/home"
              className="text-2xl font-bold text-gray-900"
            >
              Campzii
            </Link>
          </div>
        </nav>

        <div className="max-w-2xl mx-auto px-6 py-16">

          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">

            <h1 className="text-2xl font-bold text-gray-900">
              This listing is sold
            </h1>

            <p className="mt-2 text-gray-500">
              Sold listings cannot be edited.
            </p>

            <Link
              href="/my-listings"
              className="inline-block mt-6 bg-gray-900 text-white rounded-lg px-6 py-3 font-medium hover:bg-gray-800"
            >
              Back to My Listings
            </Link>

          </div>

        </div>
      </main>
    );
  }

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

          <Link
            href="/my-listings"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Back to My Listings
          </Link>

        </div>
      </nav>

      {/* Page */}
      <div className="max-w-2xl mx-auto px-6 py-10">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Edit Listing
          </h1>

          <p className="mt-2 text-gray-500">
            Update the details of your item.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8"
        >

          {error && (
            <div className="mb-6 bg-red-50 text-red-700 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Product Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              maxLength={100}
              required
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-900"
              placeholder="Example: Engineering Mathematics Book"
            />
          </div>

          {/* Description */}
          <div className="mt-5">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              maxLength={2000}
              rows={5}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-900 resize-none"
              placeholder="Describe your item..."
            />

            <p className="mt-1 text-xs text-gray-400">
              {description.length}/2000
            </p>
          </div>

          {/* Price */}
          <div className="mt-5">
            <label className="block text-sm font-medium text-gray-700">
              Price
            </label>

            <div className="mt-2 flex">

              <span className="flex items-center px-4 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600">
                ₹
              </span>

              <input
                type="number"
                value={price}
                onChange={(event) =>
                  setPrice(event.target.value)
                }
                min="1"
                step="0.01"
                required
                className="w-full rounded-r-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-900"
                placeholder="450"
              />

            </div>
          </div>

          {/* Category */}
          <div className="mt-5">
            <label className="block text-sm font-medium text-gray-700">
              Category
            </label>

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              required
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 bg-white outline-none focus:border-gray-900"
            >
              <option value="">
                Select category
              </option>

              <option value="Books">
                Books
              </option>

              <option value="Electronics">
                Electronics
              </option>

              <option value="Furniture">
                Furniture
              </option>

              <option value="Clothing">
                Clothing
              </option>

              <option value="Stationery">
                Stationery
              </option>

              <option value="Sports">
                Sports
              </option>

              <option value="Other">
                Other
              </option>
            </select>
          </div>

          {/* Condition */}
          <div className="mt-5">
            <label className="block text-sm font-medium text-gray-700">
              Condition
            </label>

            <select
              value={condition}
              onChange={(event) =>
                setCondition(event.target.value)
              }
              required
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 bg-white outline-none focus:border-gray-900"
            >
              <option value="">
                Select condition
              </option>

              <option value="New">
                New
              </option>

              <option value="Like New">
                Like New
              </option>

              <option value="Good">
                Good
              </option>

              <option value="Fair">
                Fair
              </option>

              <option value="Poor">
                Poor
              </option>
            </select>
          </div>

          {/* Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">

            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gray-900 text-white rounded-lg py-3 font-medium hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>

            <Link
              href="/my-listings"
              className="flex-1 bg-white border border-gray-300 text-gray-700 rounded-lg py-3 font-medium text-center hover:bg-gray-50"
            >
              Cancel
            </Link>

          </div>

        </form>

      </div>
    </main>
  );
}