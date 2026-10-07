import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/app/lib/db";
import { verifySession } from "@/app/lib/auth";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("campzii_session")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in to sell an item",
        },
        { status: 401 }
      );
    }

    const session = await verifySession(token);

    if (!session || !session.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired session",
        },
        { status: 401 }
      );
    }

    const sellerId = Number(session.userId);

    const userResult = await pool.query(
      `SELECT id, campus
       FROM users
       WHERE id = $1`,
      [sellerId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    const campus = userResult.rows[0].campus;

    const {
      name,
      description,
      price,
      category,
      condition,
    } = await request.json();

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Product name is required",
        },
        { status: 400 }
      );
    }

    if (
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Price must be a valid number greater than 0",
        },
        { status: 400 }
      );
    }

    if (
      typeof category !== "string" ||
      !category.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Category is required",
        },
        { status: 400 }
      );
    }

    if (
      typeof condition !== "string" ||
      !condition.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Condition is required",
        },
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product name must be 100 characters or less",
        },
        { status: 400 }
      );
    }

    if (
      description &&
      typeof description === "string" &&
      description.length > 2000
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Description must be 2000 characters or less",
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO products
        (
          seller_id,
          name,
          description,
          price,
          category,
          condition,
          campus
        )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING
        id,
        seller_id,
        name,
        description,
        price,
        category,
        condition,
        campus,
        status,
        created_at`,
      [
        sellerId,
        name.trim(),
        description?.trim() || null,
        price,
        category.trim(),
        condition.trim(),
        campus,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Product listed successfully",
        product: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Create product error:",
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

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("campzii_session")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in",
        },
        { status: 401 }
      );
    }

    const session = await verifySession(token);

    if (!session || !session.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired session",
        },
        { status: 401 }
      );
    }

    const userResult = await pool.query(
      `SELECT campus
       FROM users
       WHERE id = $1`,
      [Number(session.userId)]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    const campus = userResult.rows[0].campus;

    const result = await pool.query(
      `SELECT
        p.id,
        p.seller_id,
        p.name,
        p.description,
        p.price,
        p.category,
        p.condition,
        p.campus,
        p.status,
        p.created_at,
        u.name AS seller_name,

        (
          SELECT pi.image_url
          FROM product_images pi
          WHERE pi.product_id = p.id
          ORDER BY pi.created_at ASC
          LIMIT 1
        ) AS image_url

       FROM products p

       JOIN users u
         ON p.seller_id = u.id

       WHERE p.campus = $1
       AND p.status = 'available'

       ORDER BY p.created_at DESC`,
      [campus]
    );

    return NextResponse.json({
      success: true,
      products: result.rows,
    });
  } catch (error) {
    console.error(
      "Get products error:",
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