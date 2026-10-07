import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import pool from "@/app/lib/db";
import { verifySession } from "@/app/lib/auth";

async function getLoggedInUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("campzii_session")?.value;

  if (!token) {
    return null;
  }

  const session = await verifySession(token);

  if (!session || !session.userId) {
    return null;
  }

  return Number(session.userId);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getLoggedInUserId();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in",
        },
        { status: 401 }
      );
    }

    const { id } = await params;
    const productId = Number(id);

    if (!Number.isInteger(productId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID",
        },
        { status: 400 }
      );
    }

    // Check that the product belongs to the logged-in seller
    const productResult = await pool.query(
      `SELECT id, status
       FROM products
       WHERE id = $1
       AND seller_id = $2`,
      [productId, userId]
    );

    if (productResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product not found or you are not the owner",
        },
        { status: 404 }
      );
    }

    const product = productResult.rows[0];

    // Do not allow images to be added to sold listings
    if (product.status !== "available") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Images cannot be added to a sold listing",
        },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "Image file is required",
        },
        { status: 400 }
      );
    }

    // Maximum image size: 5 MB
    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          message: "Image must be smaller than 5 MB",
        },
        { status: 400 }
      );
    }

    // Only allow common image types
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only JPG, PNG and WEBP images are allowed",
        },
        { status: 400 }
      );
    }

    // Allow a maximum of 5 images per product
    const imageCountResult = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM product_images
       WHERE product_id = $1`,
      [productId]
    );

    const imageCount =
      imageCountResult.rows[0].count;

    if (imageCount >= 5) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A product can have a maximum of 5 images",
        },
        { status: 400 }
      );
    }

    const extensionMap: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    };

    const extension = extensionMap[file.type];

    const fileName = `product-${productId}-${Date.now()}${extension}`;

    const uploadDirectory = path.join(
      process.cwd(),
      "public",
      "uploads"
    );

    await mkdir(uploadDirectory, {
      recursive: true,
    });

    const filePath = path.join(
      uploadDirectory,
      fileName
    );

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(filePath, buffer);

    const imageUrl = `/uploads/${fileName}`;

    const result = await pool.query(
      `INSERT INTO product_images
        (product_id, image_url)
       VALUES ($1, $2)
       RETURNING
        id,
        product_id,
        image_url,
        created_at`,
      [productId, imageUrl]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Image uploaded successfully",
        image: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Upload product image error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while uploading the image",
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getLoggedInUserId();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in",
        },
        { status: 401 }
      );
    }

    const { id } = await params;
    const productId = Number(id);

    if (!Number.isInteger(productId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID",
        },
        { status: 400 }
      );
    }

    // Make sure the user belongs to the same campus
    // as the product.
    const result = await pool.query(
      `SELECT
        pi.id,
        pi.product_id,
        pi.image_url,
        pi.created_at
       FROM product_images pi
       JOIN products p
         ON pi.product_id = p.id
       JOIN users u
         ON u.id = $2
       WHERE pi.product_id = $1
       AND p.campus = u.campus
       ORDER BY pi.created_at ASC`,
      [productId, userId]
    );

    return NextResponse.json({
      success: true,
      images: result.rows,
    });
  } catch (error) {
    console.error(
      "Get product images error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}