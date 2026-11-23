
const mongoose = require("mongoose");

const mentorFeedbackSchema = new mongoose.Schema(
    {
        submissionId: {
            type: String,
            required: true,
            index: true
        },
        reviewId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review",
            required: true
        },
        studentId: {
            type: String,
            required: true,
            index: true
        },
        mentorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        message: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 3000
        }
    },
    {
        timestamps: true
    }
);

mentorFeedbackSchema.index({
    submissionId: 1,
    mentorId: 1
});

module.exports = mongoose.model(
    "MentorFeedback",
    mentorFeedbackSchema
);
