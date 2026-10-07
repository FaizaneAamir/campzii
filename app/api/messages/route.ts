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

// Get messages
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const conversationId =
      searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        {
          success: false,
          message: "Conversation ID is required",
        },
        { status: 400 }
      );
    }

    const conversationResult = await pool.query(
      `SELECT id
       FROM conversations
       WHERE id = $1
       AND (buyer_id = $2 OR seller_id = $2)`,
      [conversationId, userId]
    );

    if (conversationResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Conversation not found",
        },
        { status: 404 }
      );
    }

    const result = await pool.query(
      `SELECT
        m.id,
        m.conversation_id,
        m.sender_id,
        m.message,
        m.created_at,
        u.name AS sender_name
       FROM messages m
       JOIN users u
         ON m.sender_id = u.id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [conversationId]
    );

    return NextResponse.json({
      success: true,
      messages: result.rows,
    });
  } catch (error) {
    console.error("Get messages error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}

// Send message
export async function POST(request: Request) {
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

    const { conversationId, message } =
      await request.json();

    if (!conversationId || !message?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Conversation ID and message are required",
        },
        { status: 400 }
      );
    }

    // Check that the user belongs to the conversation
    const conversationResult = await pool.query(
      `SELECT
        c.id,
        c.product_id
       FROM conversations c
       WHERE c.id = $1
       AND (c.buyer_id = $2 OR c.seller_id = $2)`,
      [conversationId, userId]
    );

    if (conversationResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Conversation not found",
        },
        { status: 404 }
      );
    }

    const productId =
      conversationResult.rows[0].product_id;

    // Check product status
    const productResult = await pool.query(
      `SELECT id, status
       FROM products
       WHERE id = $1`,
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

    if (product.status !== "available") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This item is no longer available. You cannot send new messages.",
        },
        { status: 400 }
      );
    }

    // Save message
    const result = await pool.query(
      `INSERT INTO messages
        (conversation_id, sender_id, message)
       VALUES ($1, $2, $3)
       RETURNING
        id,
        conversation_id,
        sender_id,
        message,
        created_at`,
      [
        conversationId,
        userId,
        message.trim(),
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Message sent successfully",
        data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Send message error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}