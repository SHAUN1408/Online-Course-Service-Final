//src/app/api/course/route.js

import { getClientPromise } from "@/lib/mongodb";
import { verifyJWT } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/utils";

// CREATE COURSE - Teachers only
export async function POST(request) {
  try {
    const user = verifyJWT(request);

    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    if (user.role !== "Teacher") {
      return errorResponse("Only Teachers can create courses", 403);
    }

    const body = await request.json();

    const {
      courseName,
      duration,
      topics,
      price,
      maxStudent,
      status,
    } = body;

    if (
      typeof courseName !== "string" ||
      !courseName.trim() ||
      !Number.isInteger(duration) ||
      duration <= 0 ||
      !Array.isArray(topics) ||
      topics.length === 0 ||
      !topics.every(t => typeof t === "string" && t.trim()) ||
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isInteger(maxStudent) ||
      maxStudent <= 0 ||
      !["Open", "Close", "Cancel"].includes(status)
    ) {
      return errorResponse("Invalid course information", 400);
    }

    const client = await getClientPromise();
    const db = client.db("online_course");

    const course = {
      courseName: courseName.trim(),
      duration,
      topics: topics.map(t => t.trim()),
      price,
      maxStudent,
      status,
      teacherId: user.id,
      enrolledStudents: [],
      createdAt: new Date(),
    };

    const result = await db.collection("courses").insertOne(course);

    return successResponse(
      {
        message: "Course created successfully",
        courseId: result.insertedId.toString(),
      },
      201
    );
  } catch (error) {
    console.error("Create course error:", error);
    return errorResponse("Internal server error", 500);
  }
}

// GET COURSES - Teachers and Students
export async function GET(request) {
  try {
    const user = verifyJWT(request);

    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const client = await getClientPromise();
    const db = client.db("online_course");

    let filter = {};

    if (user.role === "Teacher") {
      // Teachers can view only their own courses
      filter = { teacherId: user.id };
    } else if (user.role === "Student") {
      // Students cannot see cancelled courses
      filter = { status: { $ne: "Cancel" } };
    } else {
      return errorResponse("Forbidden", 403);
    }

    const courses = await db
      .collection("courses")
      .find(filter)
      .toArray();

    return successResponse({ courses }, 200);
  } catch (error) {
    console.error("Get courses error:", error);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * Course endpoints go here
 */