//src/app/api/user/[user_id]/route.js

import { ObjectId } from "mongodb";
import { getClientPromise } from "@/lib/mongodb";
import { verifyJWT } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/utils";

// GET - View own user profile by ID
export async function GET(request, { params }) {
  try {
    const user = verifyJWT(request);

    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const { user_id } = await params;

    if (!ObjectId.isValid(user_id)) {
      return errorResponse("Invalid user ID", 400);
    }

    // Users can only view their own private profile.
    if (user.id !== user_id) {
      return errorResponse("Forbidden", 403);
    }

    const client = await getClientPromise();
    const db = client.db("online_course");

    const userData = await db.collection("users").findOne(
      {
        _id: new ObjectId(user_id),
      },
      {
        projection: {
          password: 0,
        },
      }
    );

    if (!userData) {
      return errorResponse("User not found", 404);
    }

    if (userData.role === "Student") {
      const enrolledCourses = await db
        .collection("courses")
        .find({
          enrolledStudents: user_id,
        })
        .project({
          enrolledStudents: 0,
        })
        .toArray();

      return successResponse(
        {
          user: userData,
          enrolledCourses,
        },
        200
      );
    }

    return successResponse(
      {
        user: userData,
      },
      200
    );
  } catch (error) {
    console.error("Get user by ID error:", error);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * Specific user id endpoints go here
 */
