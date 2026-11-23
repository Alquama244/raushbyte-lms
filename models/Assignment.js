const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 150
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000
        },
        instructions: {
            type: String,
            required: true,
            trim: true,
            maxlength: 10000
        },
        language: {
            type: String,
            enum: ["python"],
            default: "python"
        },
        dueDate: {
            type: Date,
            default: null
        },
        isPublished: {
            type: Boolean,
            default: false
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Assignment", assignmentSchema);
