//src/app/api/course/[course_id]/route.js

import { ObjectId } from "mongodb";
import { getClientPromise } from "@/lib/mongodb";
import { verifyJWT } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/utils";

// GET - View course details
export async function GET(request, { params }) {
  try {
    const user = verifyJWT(request);

    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const { course_id } = await params;

    if (!ObjectId.isValid(course_id)) {
      return errorResponse("Invalid course ID", 400);
    }

    const client = await getClientPromise();
    const db = client.db("online_course");

    const course = await db.collection("courses").findOne({
      _id: new ObjectId(course_id),
    });

    if (!course) {
      return errorResponse("Course not found", 404);
    }

    if (user.role === "Teacher") {
      if (course.teacherId !== user.id) {
        return errorResponse("Forbidden", 403);
      }

      const studentIds = course.enrolledStudents || [];

      const students = await db.collection("users")
        .find({
          _id: {
            $in: studentIds.map(id => new ObjectId(id)),
          },
        })
        .project({
          username: 1,
          email: 1,
        })
        .toArray();

      return successResponse({ course, students }, 200);
    }

    if (user.role === "Student") {
      if (course.status === "Cancel") {
        return errorResponse("Course not available", 404);
      }

      const { enrolledStudents, ...publicCourse } = course;

      return successResponse(
        {
          course: {
            ...publicCourse,
            enrolledCount: enrolledStudents?.length || 0,
          },
        },
        200
      );
    }

    return errorResponse("Forbidden", 403);
  } catch (error) {
    console.error("Get course error:", error);
    return errorResponse("Internal server error", 500);
  }
}

// PUT - Update course (owner only)
export async function PUT(request, { params }) {
  try {
    const user = verifyJWT(request);

    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    if (user.role !== "Teacher") {
      return errorResponse("Only Teachers can update courses", 403);
    }

    const { course_id } = await params;

    if (!ObjectId.isValid(course_id)) {
      return errorResponse("Invalid course ID", 400);
    }

    const body = await request.json();

    const allowedFields = [
      "courseName",
      "duration",
      "topics",
      "price",
      "maxStudent",
      "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse("No valid fields to update", 400);
    }

    if (
      ("courseName" in updates &&
        (typeof updates.courseName !== "string" ||
          !updates.courseName.trim())) ||
      ("duration" in updates &&
        (!Number.isInteger(updates.duration) ||
          updates.duration <= 0)) ||
      ("topics" in updates &&
        (!Array.isArray(updates.topics) ||
          updates.topics.length === 0 ||
          !updates.topics.every(
            t => typeof t === "string" && t.trim()
          ))) ||
      ("price" in updates &&
        (typeof updates.price !== "number" ||
          !Number.isFinite(updates.price) ||
          updates.price < 0)) ||
      ("maxStudent" in updates &&
        (!Number.isInteger(updates.maxStudent) ||
          updates.maxStudent <= 0)) ||
      ("status" in updates &&
        !["Open", "Close", "Cancel"].includes(updates.status))
    ) {
      return errorResponse("Invalid course information", 400);
    }

    if ("courseName" in updates) {
      updates.courseName = updates.courseName.trim();
    }

    if ("topics" in updates) {
      updates.topics = updates.topics.map(t => t.trim());
    }

    const client = await getClientPromise();
    const db = client.db("online_course");

    const courses = db.collection("courses");

    const course = await courses.findOne({
      _id: new ObjectId(course_id),
      teacherId: user.id,
    });

    if (!course) {
      return errorResponse("Course not found or forbidden", 404);
    }

    if (
      "maxStudent" in updates &&
      updates.maxStudent < (course.enrolledStudents?.length || 0)
    ) {
      return errorResponse(
        "Max Student cannot be less than enrolled students",
        400
      );
    }

    updates.updatedAt = new Date();

    await courses.updateOne(
      {
        _id: new ObjectId(course_id),
        teacherId: user.id,
      },
      { $set: updates }
    );

    return successResponse(
      { message: "Course updated successfully" },
      200
    );
  } catch (error) {
    console.error("Update course error:", error);
    return errorResponse("Internal server error", 500);
  }
}

// DELETE - Owner only, no enrolled students
export async function DELETE(request, { params }) {
  try {
    const user = verifyJWT(request);

    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    if (user.role !== "Teacher") {
      return errorResponse("Only Teachers can delete courses", 403);
    }

    const { course_id } = await params;

    if (!ObjectId.isValid(course_id)) {
      return errorResponse("Invalid course ID", 400);
    }

    const client = await getClientPromise();
    const db = client.db("online_course");

    const result = await db.collection("courses").deleteOne({
      _id: new ObjectId(course_id),
      teacherId: user.id,
      enrolledStudents: { $size: 0 },
    });

    if (result.deletedCount === 0) {
      return errorResponse(
        "Course not found, not owned, or has enrolled students",
        403
      );
    }

    return successResponse(
      { message: "Course deleted successfully" },
      200
    );
  } catch (error) {
    console.error("Delete course error:", error);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * Specific course id API endpoints go here.
 */