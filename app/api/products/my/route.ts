import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/app/lib/db";
import { verifySession } from "@/app/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get("campzii_session")?.value;

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

        (
          SELECT pi.image_url
          FROM product_images pi
          WHERE pi.product_id = p.id
          ORDER BY pi.created_at ASC
          LIMIT 1
        ) AS image_url

       FROM products p

       WHERE p.seller_id = $1

       ORDER BY p.created_at DESC`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      products: result.rows,
    });
  } catch (error) {
    console.error(
      "Get my products error:",
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