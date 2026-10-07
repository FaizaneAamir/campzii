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

    const {
      name,
      description,
      price,
      category,
      condition,
    } = await request.json();

    // Validate product name
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

    // Validate price
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

    // Validate category
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

    // Validate condition
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

    // Prevent extremely long input
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

    // Check ownership
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

    // Don't allow editing a sold listing
    if (productResult.rows[0].status !== "available") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Sold listings cannot be edited",
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE products
       SET
         name = $1,
         description = $2,
         price = $3,
         category = $4,
         condition = $5
       WHERE id = $6
       AND seller_id = $7
       AND status = 'available'
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
        name.trim(),
        description?.trim() || null,
        price,
        category.trim(),
        condition.trim(),
        id,
        userId,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product could not be updated",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      product: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Update product error:",
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