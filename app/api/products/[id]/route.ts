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

    const userResult = await pool.query(
      `SELECT campus
       FROM users
       WHERE id = $1`,
      [userId]
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

    const userCampus = userResult.rows[0].campus;

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
        u.email AS seller_email
       FROM products p
       JOIN users u ON p.seller_id = u.id
       WHERE p.id = $1
       AND p.campus = $2
       AND p.status = 'available'`,
      [id, userCampus]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found or no longer available",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product: result.rows[0],
    });
  } catch (error) {
    console.error("Get product error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}