const requireMentor = (req, res, next) => {
    if (!req.user || req.user.role !== "mentor") {
        return res.status(403).json({
            error: "Access denied. Mentor privileges are required."
        });
    }

    next();
};

module.exports = requireMentor;
