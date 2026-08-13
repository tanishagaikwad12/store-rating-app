const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateToken, authorizeRoles("ADMIN"));

// Summary data for the admin dashboard.
router.get("/dashboard", async (req, res) => {
    try {
        const [[users], [stores], [ratings]] = await Promise.all([
            db.query("SELECT COUNT(*) AS total_users FROM users"),
            db.query("SELECT COUNT(*) AS total_stores FROM stores"),
            db.query("SELECT COUNT(*) AS total_ratings FROM ratings")
        ]);

        res.json({
            totalUsers: users[0].total_users,
            totalStores: stores[0].total_stores,
            totalRatings: ratings[0].total_ratings
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
});

// Admin-only user details. Password values are deliberately never selected.
router.get("/users/:userId", async (req, res) => {
    try {
        const [users] = await db.query(
            "SELECT id, name, email, address, role FROM users WHERE id = ?",
            [req.params.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = users[0];

        if (user.role === "OWNER" || user.role === "STORE_OWNER") {
            const [stores] = await db.query(
                `SELECT s.id, s.name, s.email, s.address,
                    COALESCE(AVG(r.rating), 0) AS average_rating
                 FROM stores s
                 LEFT JOIN ratings r ON r.store_id = s.id
                 WHERE s.owner_id = ?
                 GROUP BY s.id
                 ORDER BY s.name ASC`,
                [user.id]
            );
            user.stores = stores;
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch user details" });
    }
});

// User directory for admin search and management. Store data continues to use GET /api/stores.
router.get("/users", async (req, res) => {
    try {
        const { search } = req.query;
        let query = "SELECT id, name, email, address, role FROM users";
        const params = [];

        if (search) {
            const searchValue = `%${search}%`;
            query += `
                WHERE name LIKE ? OR email LIKE ? OR address LIKE ? OR role LIKE ?
            `;
            params.push(searchValue, searchValue, searchValue, searchValue);
        }

        query += " ORDER BY name ASC";
        const [users] = await db.query(query, params);
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch users" });
    }
});

// Creates accounts for roles that cannot be created through the public registration route.
router.post("/users", async (req, res) => {
    try {
        const { name, email, address, password, role } = req.body;
        const validRoles = ["USER", "ADMIN", "OWNER"];

        if (!name || !email || !address || !password || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (name.length < 20 || name.length > 60) {
            return res.status(400).json({
                message: "Name must be between 20 and 60 characters"
            });
        }

        if (address.length > 400) {
            return res.status(400).json({ message: "Address cannot exceed 400 characters" });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: "Invalid email address" });
        }

        if (!/^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/.test(password)) {
            return res.status(400).json({
                message: "Password must be 8-16 characters and contain at least one uppercase letter and one special character"
            });
        }

        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid user role" });
        }

        const [existingUser] = await db.query(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({ message: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            "INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)",
            [name, email, hashedPassword, address, role]
        );

        res.status(201).json({
            message: "User created successfully",
            user: { id: result.insertId, name, email, address, role }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to create user" });
    }
});

module.exports = router;
