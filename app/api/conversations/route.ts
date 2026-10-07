import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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

// Get user's conversations
export async function GET() {
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

    const result = await pool.query(
      `SELECT
        c.id,
        c.product_id,
        c.buyer_id,
        c.seller_id,
        c.status,
        c.created_at,

        p.name AS product_name,
        p.price AS product_price,
        p.status AS product_status,

        buyer.name AS buyer_name,
        seller.name AS seller_name,

        last_message.message AS last_message,
        last_message.created_at AS last_message_at

       FROM conversations c

       JOIN products p
         ON c.product_id = p.id

       JOIN users buyer
         ON c.buyer_id = buyer.id

       JOIN users seller
         ON c.seller_id = seller.id

       LEFT JOIN LATERAL (
         SELECT
           m.message,
           m.created_at
         FROM messages m
         WHERE m.conversation_id = c.id
         ORDER BY m.created_at DESC
         LIMIT 1
       ) last_message ON true

       WHERE c.buyer_id = $1
       OR c.seller_id = $1

       ORDER BY
         COALESCE(
           last_message.created_at,
           c.created_at
         ) DESC`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      conversations: result.rows,
    });
  } catch (error) {
    console.error(
      "Get conversations error:",
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

// Start or open a conversation
export async function POST(request: Request) {
  try {
    const buyerId = await getLoggedInUserId();

    if (!buyerId) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in",
        },
        { status: 401 }
      );
    }

    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message: "Product ID is required",
        },
        { status: 400 }
      );
    }

    // Get buyer's campus
    const buyerResult = await pool.query(
      `SELECT id, campus
       FROM users
       WHERE id = $1`,
      [buyerId]
    );

    if (buyerResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    const buyerCampus = buyerResult.rows[0].campus;

    // Get product and seller information
    const productResult = await pool.query(
      `SELECT
        p.id,
        p.seller_id,
        p.name,
        p.status,
        p.campus,
        u.name AS seller_name,
        u.campus AS seller_campus
       FROM products p
       JOIN users u
         ON p.seller_id = u.id
       WHERE p.id = $1`,
      [productId]
    );

    if (productResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 }
      );
    }

    const product = productResult.rows[0];

    // Seller cannot contact themselves
    if (buyerId === product.seller_id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You cannot start a conversation with yourself",
        },
        { status: 400 }
      );
    }

    // Sold products cannot receive new conversations
    if (product.status !== "available") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This item is no longer available",
        },
        { status: 400 }
      );
    }

    // Buyer must belong to the same campus
    if (buyerCampus !== product.campus) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You can only contact sellers from your campus",
        },
        { status: 403 }
      );
    }

    // Check if conversation already exists
    const existingConversation =
      await pool.query(
        `SELECT id
         FROM conversations
         WHERE product_id = $1
         AND buyer_id = $2
         AND seller_id = $3`,
        [
          productId,
          buyerId,
          product.seller_id,
        ]
      );

    if (existingConversation.rows.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Conversation already exists",
        conversation: {
          id: existingConversation.rows[0].id,
        },
      });
    }

    // Create conversation
    const result = await pool.query(
      `INSERT INTO conversations
        (product_id, buyer_id, seller_id)
       VALUES ($1, $2, $3)
       RETURNING
        id,
        product_id,
        buyer_id,
        seller_id,
        status,
        created_at`,
      [
        productId,
        buyerId,
        product.seller_id,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Conversation created",
        conversation: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Create conversation error:",
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