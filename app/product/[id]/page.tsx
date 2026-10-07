import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import ContactSellerButton from "@/app/components/ContactSellerButton";

type Product = {
  id: number;
  seller_id: number;
  name: string;
  description: string | null;
  price: string;
  category: string;
  condition: string;
  campus: string;
  status: string;
  created_at: string;
  seller_name: string;
  seller_email: string;
};

type ProductImage = {
  id: number;
  product_id: number;
  image_url: string;
  created_at: string;
};

async function getProduct(
  id: string,
  cookieHeader: string
): Promise<Product | null> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  try {
    const response = await fetch(
      `${baseUrl}/api/products/${id}`,
      {
        cache: "no-store",
        headers: {
          Cookie: cookieHeader,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    return data.product || null;
  } catch (error) {
    console.error(
      "Product fetch error:",
      error
    );

    return null;
  }
}

async function getProductImages(
  id: string,
  cookieHeader: string
): Promise<ProductImage[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  try {
    const response = await fetch(
      `${baseUrl}/api/products/${id}/images`,
      {
        cache: "no-store",
        headers: {
          Cookie: cookieHeader,
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    return data.images || [];
  } catch (error) {
    console.error(
      "Product images fetch error:",
      error
    );

    return [];
  }
}

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cookieStore = await cookies();

  const cookieHeader = cookieStore
    .getAll()
    .map(
      (cookie) =>
        `${cookie.name}=${cookie.value}`
    )
    .join("; ");

  const product = await getProduct(
    id,
    cookieHeader
  );

  if (!product) {
    notFound();
  }

  const images = await getProductImages(
    id,
    cookieHeader
  );

  const mainImage =
    images.length > 0
      ? images[0].image_url
      : null;

  return (
    <main className="min-h-screen bg-gray-100">
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
              href="/my-listings"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              My Listings
            </Link>

            <Link
              href="/home"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Product Image */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="h-[450px] bg-gray-100 flex items-center justify-center">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-lg">
                  No Image
                </span>
              )}
            </div>
          </div>

          {/* Product Information */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8">

            <p className="text-sm text-gray-500">
              {product.category}
            </p>

            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              {product.name}
            </h1>

            <p className="mt-5 text-3xl font-bold text-gray-900">
              ₹{product.price}
            </p>

            <div className="mt-6 border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Description
              </h2>

              <p className="mt-2 text-gray-600 whitespace-pre-line">
                {product.description ||
                  "No description provided."}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500">
                  Condition
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {product.condition}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500">
                  Campus
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {product.campus}
                </p>
              </div>
            </div>

            <div className="mt-6 border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Seller
              </h2>

              <p className="mt-2 text-gray-700">
                {product.seller_name}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {product.seller_email}
              </p>
            </div>

            <ContactSellerButton
              productId={product.id}
            />

          </div>
        </div>

        {/* Additional Images */}
        {images.length > 1 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              More Images
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.slice(1).map((image) => (
                <div
                  key={image.id}
                  className="h-40 bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  <img
                    src={image.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}