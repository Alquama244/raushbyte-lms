const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        submissionId: {
            type: String,
            required: true,
            unique: true
        },
        assignmentId: String,
        studentId: String,
        language: String,
        request: mongoose.Schema.Types.Mixed,
        result: mongoose.Schema.Types.Mixed
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Review", reviewSchema);
