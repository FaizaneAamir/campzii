import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import pool from "@/app/lib/db";

export async function POST(request: Request) {
  try {
    const { name, email, password, campus } = await request.json();

    if (!name || !email || !password || !campus) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required",
        },
        { status: 400 }
      );
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Email already registered",
        },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, campus)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, campus, created_at`,
      [name, email, hashedPassword, campus]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful",
        user: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}
