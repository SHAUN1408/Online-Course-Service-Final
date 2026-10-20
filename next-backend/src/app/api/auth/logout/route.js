
import { successResponse } from "@/lib/utils";

// POST - Log out the current user
export async function POST() {
  try {
    const response = successResponse(
      { message: "Logout successful" },
      200
    );

    // Delete the JWT authentication cookie
    response.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);

    return successResponse(
      { message: "Logout successful" },
      200
    );
  }
}
