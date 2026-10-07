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

export async function DELETE(
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

    // Check that the product belongs to the logged-in user
    const productResult = await pool.query(
      `SELECT id
       FROM products
       WHERE id = $1
       AND seller_id = $2`,
      [id, userId]
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

    // Delete the product
    await pool.query(
      `DELETE FROM products
       WHERE id = $1
       AND seller_id = $2`,
      [id, userId]
    );

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}