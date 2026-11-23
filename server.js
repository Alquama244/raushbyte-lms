
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const Review = require("./models/Review");
const MentorFeedback = require("./models/MentorFeedback");

const authRoutes = require("./routes/auth");
const assignmentRoutes = require("./routes/assignments");
const mentorRoutes = require("./routes/mentor");

const authenticateToken = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 5000;
const AI_REVIEW_URL = "http://127.0.0.1:8000";

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/mentor", mentorRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Welcome to RaushByte Learn LMS",
        status: "running"
    });
});

app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "healthy",
        service: "RaushByte Learn LMS Backend",
        database: "connected",
        aiReviewService: AI_REVIEW_URL
    });
});

// Retrieve one review belonging to the authenticated student.
app.get(
    "/api/reviews/:submissionId",
    authenticateToken,
    async (req, res) => {
        try {
            const review = await Review.findOne({
                submissionId: req.params.submissionId,
                studentId: req.user.userId
            });

            if (!review) {
                return res.status(404).json({
                    message: "Review not found."
                });
            }

            return res.status(200).json(review);
        } catch (error) {
            console.error("Review retrieval error:", error.message);

            return res.status(500).json({
                message: "Could not retrieve review."
            });
        }
    }
);

// Retrieve the authenticated student's AI review history.
app.get("/api/my/reviews", authenticateToken, async (req, res) => {
    try {
        const reviews = await Review.find({
            studentId: req.user.userId
        })
            .sort({ createdAt: -1 })
            .limit(50)
            .select("-request");

        return res.status(200).json({
            total: reviews.length,
            reviews
        });
    } catch (error) {
        console.error("Review history error:", error.message);

        return res.status(500).json({
            message: "Could not retrieve review history."
        });
    }
});

// Retrieve mentor feedback belonging only to the authenticated student.
app.get(
    "/api/my/mentor-feedback",
    authenticateToken,
    async (req, res) => {
        try {
            const feedback = await MentorFeedback.find({
                studentId: req.user.userId
            })
                .populate("mentorId", "name email")
                .sort({ createdAt: -1 });

            return res.status(200).json({
                total: feedback.length,
                feedback
            });
        } catch (error) {
            console.error("Mentor feedback retrieval error:", error.message);

            return res.status(500).json({
                message: "Could not retrieve mentor feedback."
            });
        }
    }
);

// Submit code for authenticated AI review.
app.post("/api/reviews", authenticateToken, async (req, res) => {
    try {
        if (!req.body.submission_id) {
            return res.status(400).json({
                message: "submission_id is required."
            });
        }

        const NIL_UUID = "00000000-0000-0000-0000-000000000000";

        const isUuid = (value) =>
            typeof value === "string" &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

        const reviewRequest = {
            ...req.body,
            assignment_id: isUuid(req.body.assignment_id)
                ? req.body.assignment_id
                : NIL_UUID,
            student_id: NIL_UUID
        };

        const response = await fetch(
            `${AI_REVIEW_URL}/api/v1/review`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(reviewRequest)
            }
        );

        const result = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(result);
        }

        const savedReview = await Review.findOneAndUpdate(
            {
                submissionId: req.body.submission_id,
                studentId: req.user.userId
            },
            {
                $set: {
                    assignmentId: req.body.assignment_id,
                    studentId: req.user.userId,
                    language: req.body.language,
                    request: reviewRequest,
                    result: result
                }
            },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        );

        return res.status(200).json({
            ...result,
            database: {
                saved: true,
                reviewId: savedReview._id
            }
        });
    } catch (error) {
        console.error("Review processing error:", error.message);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "This submission ID is already in use."
            });
        }

        return res.status(500).json({
            message: "Review processing or database saving failed."
        });
    }
});

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(
            `RaushByte LMS backend running at http://localhost:${PORT}`
        );
    });
};

startServer();
