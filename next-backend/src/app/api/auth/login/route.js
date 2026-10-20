//src/app/api/auth/login/route.js

import { getClientPromise } from "@/lib/mongodb";
import { errorResponse, successResponse } from "@/lib/utils";
import corsHeaders from "@/lib/cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Handle browser CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// POST - Login
export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return errorResponse(
        "Email and password are required",
        400
      );
    }

    const client = await getClientPromise();
    const db = client.db("online_course");

    const user = await db.collection("users").findOne({
      email: email.trim(),
    });

    if (!user) {
      return errorResponse(
        "Invalid email or password",
        401
      );
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return errorResponse(
        "Invalid email or password",
        401
      );
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const response = successResponse(
      {
        message: "Login successful",
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
      200
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return errorResponse(
      "Internal server error",
      500
    );
  }
}

/**
 * Your login APIs go here
 */