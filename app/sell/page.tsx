"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import Link from "next/link";

type User = {
  id: number;
  name: string;
  email: string;
  campus: string;
};

export default function SellPage() {
  const [user, setUser] = useState<User | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] =
    useState("");

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] =
    useState(false);

  useEffect(() => {
    async function checkUser() {
      try {
        const response = await fetch(
          "/api/auth/me"
        );

        const data = await response.json();

        if (!response.ok) {
          window.location.href = "/";
          return;
        }

        setUser(data.user);
      } catch (error) {
        console.error(
          "Auth check error:",
          error
        );

        window.location.href = "/";
      } finally {
        setLoading(false);
      }
    }

    checkUser();
  }, []);

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      setImage(null);
      setImagePreview("");
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setMessage(
        "Only JPG, PNG and WEBP images are allowed."
      );

      setSuccess(false);
      setImage(null);
      setImagePreview("");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage(
        "Image must be smaller than 5 MB."
      );

      setSuccess(false);
      setImage(null);
      setImagePreview("");
      return;
    }

    setMessage("");
    setImage(file);

    const previewUrl =
      URL.createObjectURL(file);

    setImagePreview(previewUrl);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setSuccess(false);
    setSubmitting(true);

    try {
      // Step 1: Create product
      const response = await fetch(
        "/api/products",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
        setMessage(
          data.message ||
            "Failed to list product"
        );
        return;
      }

      const productId = data.product.id;

      // Step 2: Upload image if selected
      if (image) {
        const formData = new FormData();

        formData.append("image", image);

        const imageResponse = await fetch(
          `/api/products/${productId}/images`,
          {
            method: "POST",
            body: formData,
          }
        );

        const imageData =
          await imageResponse.json();

        if (!imageResponse.ok) {
          setMessage(
            `Product was listed, but image upload failed: ${
              imageData.message ||
              "Unknown error"
            }`
          );

          setSuccess(true);

          setName("");
          setDescription("");
          setPrice("");
          setCategory("");
          setCondition("");
          setImage(null);
          setImagePreview("");

          return;
        }
      }

      setSuccess(true);
      setMessage(
        "Product listed successfully!"
      );

      setName("");
      setDescription("");
      setPrice("");
      setCategory("");
      setCondition("");
      setImage(null);
      setImagePreview("");

      const fileInput =
        document.getElementById(
          "image"
        ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      console.error(
        "Sell item error:",
        error
      );

      setMessage(
        "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">
          Loading...
        </p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <nav className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
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
              href="/my-listings"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              My Listings
            </Link>

            <span className="text-sm text-gray-500">
              {user.campus}
            </span>

            <Link
              href="/home"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-8">
            <p className="text-sm text-gray-500">
              Selling on {user.campus}
            </p>

            <h1 className="text-3xl font-bold text-gray-900 mt-1">
              Sell an Item
            </h1>

            <p className="mt-2 text-gray-500">
              List your used item for students on
              your campus.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Product Name
              </label>

              <input
                id="name"
                type="text"
                placeholder="Example: Engineering Textbook"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description
              </label>

              <textarea
                id="description"
                placeholder="Describe your item..."
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none resize-none focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
              />
            </div>

            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Price
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  ₹
                </span>

                <input
                  id="price"
                  type="number"
                  min="1"
                  placeholder="Enter price"
                  value={price}
                  onChange={(event) =>
                    setPrice(event.target.value)
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 pl-9 pr-4 py-3 text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
                />
              </div>
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
                  setCategory(event.target.value)
                }
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
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

                <option value="Bags">
                  Bags
                </option>

                <option value="Furniture">
                  Furniture
                </option>

                <option value="Clothing">
                  Clothing
                </option>

                <option value="Sports">
                  Sports
                </option>

                <option value="Other">
                  Other
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="condition"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Condition
              </label>

              <select
                id="condition"
                value={condition}
                onChange={(event) =>
                  setCondition(event.target.value)
                }
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
              >
                <option value="">
                  Select condition
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

                <option value="Used">
                  Used
                </option>
              </select>
            </div>

            {/* Product Image */}
            <div>
              <label
                htmlFor="image"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Product Image
              </label>

              <input
                id="image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
              />

              <p className="mt-2 text-xs text-gray-500">
                JPG, PNG or WEBP. Maximum 5 MB.
              </p>

              {imagePreview && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Preview
                  </p>

                  <div className="w-full h-64 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            {message && (
              <div
                className={`rounded-lg px-4 py-3 text-sm ${
                  success
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-gray-900 px-4 py-3 font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Listing Item..."
                : "List Item"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}