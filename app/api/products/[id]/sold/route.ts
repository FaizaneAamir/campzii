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

export async function PUT(
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

    const productResult = await pool.query(
      `SELECT id, status
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

    const product = productResult.rows[0];

    if (product.status === "sold") {
      return NextResponse.json(
        {
          success: false,
          message: "This product is already marked as sold",
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE products
       SET status = 'sold'
       WHERE id = $1
       AND seller_id = $2
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
      [id, userId]
    );

    return NextResponse.json({
      success: true,
      message: "Product marked as sold",
      product: result.rows[0],
    });
  } catch (error) {
    console.error("Mark product sold error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}