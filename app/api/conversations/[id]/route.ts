import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/app/lib/db";
import { verifySession } from "@/app/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const userId = Number(session.userId);
    const { id } = await params;

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
        seller.name AS seller_name

       FROM conversations c

       JOIN products p
         ON c.product_id = p.id

       JOIN users buyer
         ON c.buyer_id = buyer.id

       JOIN users seller
         ON c.seller_id = seller.id

       WHERE c.id = $1
       AND (c.buyer_id = $2 OR c.seller_id = $2)`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Conversation not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      conversation: result.rows[0],
      currentUserId: userId,
    });
  } catch (error) {
    console.error("Get conversation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}