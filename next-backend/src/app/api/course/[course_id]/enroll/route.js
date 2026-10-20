
import { ObjectId } from "mongodb";
import { getClientPromise } from "@/lib/mongodb";
import { verifyJWT } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/utils";

// POST - Enroll a Student in a course
export async function POST(request, { params }) {
  try {
    const user = verifyJWT(request);

    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    if (user.role !== "Student") {
      return errorResponse("Only Students can enroll", 403);
    }

    const { course_id } = await params;

    if (!ObjectId.isValid(course_id)) {
      return errorResponse("Invalid course ID", 400);
    }

    const client = await getClientPromise();
    const db = client.db("online_course");
    const courses = db.collection("courses");

    const courseObjectId = new ObjectId(course_id);

    // Atomically enforce status, duplicate prevention,
    // and course capacity before adding the Student.
    const result = await courses.updateOne(
      {
        _id: courseObjectId,
        status: "Open",
        enrolledStudents: { $ne: user.id },
        $expr: {
          $lt: [
            { $size: "$enrolledStudents" },
            "$maxStudent",
          ],
        },
      },
      {
        $addToSet: {
          enrolledStudents: user.id,
        },
      }
    );

    if (result.modifiedCount === 1) {
      return successResponse(
        { message: "Enrolled successfully" },
        200
      );
    }

    // Explain why enrollment was rejected.
    const course = await courses.findOne({
      _id: courseObjectId,
    });

    if (!course) {
      return errorResponse("Course not found", 404);
    }

    if (course.status !== "Open") {
      return errorResponse(
        "Course is not open for enrollment",
        403
      );
    }

    if (course.enrolledStudents.includes(user.id)) {
      return errorResponse(
        "You are already enrolled in this course",
        409
      );
    }

    if (
      course.enrolledStudents.length >= course.maxStudent
    ) {
      return errorResponse("Course is full", 409);
    }

    return errorResponse("Enrollment failed", 409);
  } catch (error) {
    console.error("Enrollment error:", error);
    return errorResponse("Internal server error", 500);
  }
}
