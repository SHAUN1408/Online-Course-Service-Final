//src/app/api/user/route.js

import { getClientPromise } from "@/lib/mongodb";
import { verifyJWT } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/utils";

// GET - View the logged-in user's information
// and enrolled courses (for Students)
export async function GET(request) {
  try {
    const user = verifyJWT(request);

    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const client = await getClientPromise();
    const db = client.db("online_course");

    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    if (user.role === "Student") {
      const courses = await db
        .collection("courses")
        .find({
          enrolledStudents: user.id,
        })
        .project({
          enrolledStudents: 0,
        })
        .toArray();

      return successResponse(
        {
          user: userInfo,
          enrolledCourses: courses,
        },
        200
      );
    }

    if (user.role === "Teacher") {
      return successResponse(
        {
          user: userInfo,
        },
        200
      );
    }

    return errorResponse("Forbidden", 403);
  } catch (error) {
    console.error("Get user error:", error);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * User API endpoints go here
 */