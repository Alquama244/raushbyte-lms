const express = require("express");
const mongoose = require("mongoose");

const Assignment = require("../models/Assignment");
const authenticateToken = require("../middleware/auth");
const requireMentor = require("../middleware/requireMentor");

const router = express.Router();

// List assignments visible to the logged-in user
router.get("/", authenticateToken, async (req, res) => {
    try {
        const filter = req.user.role === "mentor"
            ? { createdBy: req.user.userId }
            : { isPublished: true };

        const assignments = await Assignment.find(filter)
            .populate("createdBy", "name")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            total: assignments.length,
            assignments
        });
    } catch (error) {
        console.error("Assignment listing error:", error.message);
        return res.status(500).json({
            error: "Could not retrieve assignments."
        });
    }
});

// Create an assignment (mentors only)
router.post("/", authenticateToken, requireMentor, async (req, res) => {
    try {
        const { title, description, instructions, language, dueDate } = req.body;

        if (
            typeof title !== "string" ||
            typeof description !== "string" ||
            typeof instructions !== "string" ||
            !title.trim() ||
            !description.trim() ||
            !instructions.trim()
        ) {
            return res.status(400).json({
                error: "Title, description and instructions are required."
            });
        }

        if (title.trim().length < 3 || title.trim().length > 150) {
            return res.status(400).json({
                error: "Title must contain between 3 and 150 characters."
            });
        }

        if (description.trim().length > 2000 || instructions.trim().length > 10000) {
            return res.status(400).json({
                error: "Description or instructions exceed the allowed length."
            });
        }

        if (language && language !== "python") {
            return res.status(400).json({
                error: "Currently, only Python assignments are supported."
            });
        }

        let parsedDueDate = null;

        if (dueDate) {
            parsedDueDate = new Date(dueDate);

            if (Number.isNaN(parsedDueDate.getTime())) {
                return res.status(400).json({
                    error: "Please provide a valid due date."
                });
            }
        }

        const assignment = await Assignment.create({
            title: title.trim(),
            description: description.trim(),
            instructions: instructions.trim(),
            language: "python",
            dueDate: parsedDueDate,
            createdBy: req.user.userId,
            isPublished: false
        });

        return res.status(201).json({
            message: "Assignment created successfully. It is currently a draft.",
            assignment
        });
    } catch (error) {
        console.error("Assignment creation error:", error.message);
        return res.status(500).json({
            error: "Could not create assignment."
        });
    }
});

// Publish or unpublish an assignment (owner mentor only)
router.patch("/:id/publish", authenticateToken, requireMentor, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                error: "Invalid assignment ID."
            });
        }

        if (typeof req.body.isPublished !== "boolean") {
            return res.status(400).json({
                error: "isPublished must be true or false."
            });
        }

        const assignment = await Assignment.findOneAndUpdate(
            {
                _id: req.params.id,
                createdBy: req.user.userId
            },
            {
                $set: { isPublished: req.body.isPublished }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!assignment) {
            return res.status(404).json({
                error: "Assignment not found."
            });
        }

        return res.status(200).json({
            message: req.body.isPublished
                ? "Assignment published successfully."
                : "Assignment unpublished successfully.",
            assignment
        });
    } catch (error) {
        console.error("Assignment publishing error:", error.message);
        return res.status(500).json({
            error: "Could not update assignment publication status."
        });
    }
});

module.exports = router;
