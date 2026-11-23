
const express = require("express");
const mongoose = require("mongoose");

const Review = require("../models/Review");
const User = require("../models/User");
const MentorFeedback = require("../models/MentorFeedback");
const mentorAuth = require("../middleware/mentorAuth");

const router = express.Router();

// All routes below require an authenticated mentor.
router.use(...mentorAuth);

// Find student names and emails using their IDs.
async function getStudentsByIds(studentIds) {
    const validIds = [
        ...new Set(
            studentIds.filter(id => mongoose.isValidObjectId(id))
        )
    ];

    if (validIds.length === 0) {
        return new Map();
    }

    const students = await User.find({
        _id: { $in: validIds },
        role: "student"
    })
        .select("name email")
        .lean();

    return new Map(
        students.map(student => [
            student._id.toString(),
            {
                name: student.name,
                email: student.email
            }
        ])
    );
}

// 1. Get all student submissions with student details.
router.get("/submissions", async (req, res) => {
    try {
        const submissions = await Review.find({})
            .sort({ createdAt: -1 })
            .select("-request")
            .lean();

        const studentMap = await getStudentsByIds(
            submissions.map(item => item.studentId)
        );

        const enrichedSubmissions = submissions.map(item => ({
            ...item,
            student: studentMap.get(String(item.studentId)) || null
        }));

        return res.status(200).json({
            total: enrichedSubmissions.length,
            submissions: enrichedSubmissions
        });
    } catch (error) {
        console.error("Mentor submissions error:", error.message);

        return res.status(500).json({
            error: "Unable to retrieve submissions."
        });
    }
});

// 2. Get one submission with code, AI review and student details.
router.get("/submissions/:submissionId", async (req, res) => {
    try {
        const submission = await Review.findOne({
            submissionId: req.params.submissionId
        }).lean();

        if (!submission) {
            return res.status(404).json({
                error: "Submission not found."
            });
        }

        const studentMap = await getStudentsByIds([
            submission.studentId
        ]);

        const enrichedSubmission = {
            ...submission,
            student: studentMap.get(String(submission.studentId)) || null
        };

        const feedback = await MentorFeedback.find({
            submissionId: submission.submissionId
        })
            .populate("mentorId", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            submission: enrichedSubmission,
            mentorFeedback: feedback
        });
    } catch (error) {
        console.error("Submission detail error:", error.message);

        return res.status(500).json({
            error: "Unable to retrieve submission details."
        });
    }
});

// 3. Get complete submission history of one student.
router.get("/students/:studentId/history", async (req, res) => {
    try {
        const studentId = req.params.studentId;

        const studentMap = await getStudentsByIds([studentId]);
        const student = studentMap.get(String(studentId)) || null;

        const submissions = await Review.find({ studentId })
            .sort({ createdAt: -1 })
            .lean();

        const feedback = await MentorFeedback.find({ studentId })
            .populate("mentorId", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            studentId,
            student,
            totalSubmissions: submissions.length,
            submissions,
            mentorFeedback: feedback
        });
    } catch (error) {
        console.error("Student history error:", error.message);

        return res.status(500).json({
            error: "Unable to retrieve student history."
        });
    }
});

// 4. Submit or update mentor feedback for a submission.
router.post("/feedback", async (req, res) => {
    try {
        const { submissionId, rating, message } = req.body;

        if (
            typeof submissionId !== "string" ||
            !submissionId.trim() ||
            !Number.isInteger(rating) ||
            rating < 1 ||
            rating > 5 ||
            typeof message !== "string" ||
            message.trim().length < 2 ||
            message.trim().length > 3000
        ) {
            return res.status(400).json({
                error: "A submission ID, rating from 1 to 5, and message between 2 and 3000 characters are required."
            });
        }

        const submission = await Review.findOne({
            submissionId: submissionId.trim()
        });

        if (!submission) {
            return res.status(404).json({
                error: "Submission not found."
            });
        }

        const feedback = await MentorFeedback.findOneAndUpdate(
            {
                submissionId: submission.submissionId,
                mentorId: req.user.userId
            },
            {
                $set: {
                    reviewId: submission._id,
                    studentId: submission.studentId,
                    rating,
                    message: message.trim()
                }
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        return res.status(200).json({
            message: "Mentor feedback saved successfully.",
            feedback
        });
    } catch (error) {
        console.error("Mentor feedback error:", error.message);

        return res.status(500).json({
            error: "Unable to save mentor feedback."
        });
    }
});

// 5. Calendar and report history with student details.
router.get("/reports", async (req, res) => {
    try {
        const submissions = await Review.find({})
            .sort({ createdAt: -1 })
            .select("submissionId studentId assignmentId createdAt")
            .lean();

        const studentMap = await getStudentsByIds(
            submissions.map(item => item.studentId)
        );

        const enrichedSubmissions = submissions.map(item => ({
            ...item,
            student: studentMap.get(String(item.studentId)) || null
        }));

        const feedback = await MentorFeedback.find({})
            .populate("mentorId", "name")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            totalSubmissions: enrichedSubmissions.length,
            totalMentorReviews: feedback.length,
            submissions: enrichedSubmissions,
            mentorFeedback: feedback
        });
    } catch (error) {
        console.error("Mentor reports error:", error.message);

        return res.status(500).json({
            error: "Unable to retrieve reports."
        });
    }
});

module.exports = router;
