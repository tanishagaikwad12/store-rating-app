const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");
const authRoutes = require("./routes/auth");
const storeRoutes = require("./routes/stores");
const ratingRoutes = require("./routes/ratings");
const adminRoutes = require("./routes/admin");
const ownerRoutes = require("./routes/owner");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/owner", ownerRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Store Rating API is running"
    });
});

app.get("/api/test-db", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT 1 AS result");

        res.json({
            message: "Database connected successfully!",
            result: rows
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Database connection failed",
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
