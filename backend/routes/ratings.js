const express = require("express");
const db = require("../config/db");
const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();


// Submit a rating
router.post(
    "/",
    authenticateToken,
    authorizeRoles("USER"),
    async (req, res) => {
        try {
            const { store_id, rating } = req.body;
            const user_id = req.user.id;

            if (!store_id || !rating) {
                return res.status(400).json({
                    message: "Store ID and rating are required"
                });
            }

            if (rating < 1 || rating > 5) {
                return res.status(400).json({
                    message: "Rating must be between 1 and 5"
                });
            }

            // Check store exists
            const [stores] = await db.query(
                "SELECT id FROM stores WHERE id = ?",
                [store_id]
            );

            if (stores.length === 0) {
                return res.status(404).json({
                    message: "Store not found"
                });
            }

            // Check if user already rated this store
            const [existingRating] = await db.query(
                `SELECT id FROM ratings
                 WHERE user_id = ? AND store_id = ?`,
                [user_id, store_id]
            );

            if (existingRating.length > 0) {
                return res.status(409).json({
                    message: "You have already rated this store"
                });
            }

            await db.query(
                `INSERT INTO ratings
                (user_id, store_id, rating)
                VALUES (?, ?, ?)`,
                [user_id, store_id, rating]
            );

            res.status(201).json({
                message: "Rating submitted successfully"
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: "Failed to submit rating"
            });
        }
    }
);


// Modify existing rating
router.put(
    "/:storeId",
    authenticateToken,
    authorizeRoles("USER"),
    async (req, res) => {
        try {
            const { storeId } = req.params;
            const { rating } = req.body;
            const user_id = req.user.id;

            if (!rating) {
                return res.status(400).json({
                    message: "Rating is required"
                });
            }

            if (rating < 1 || rating > 5) {
                return res.status(400).json({
                    message: "Rating must be between 1 and 5"
                });
            }

            const [result] = await db.query(
                `UPDATE ratings
                 SET rating = ?
                 WHERE user_id = ? AND store_id = ?`,
                [rating, user_id, storeId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Rating not found"
                });
            }

            res.json({
                message: "Rating updated successfully"
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: "Failed to update rating"
            });
        }
    }
);


// Get user's rating for a specific store
router.get(
    "/my/:storeId",
    authenticateToken,
    authorizeRoles("USER"),
    async (req, res) => {
        try {
            const { storeId } = req.params;
            const user_id = req.user.id;

            const [ratings] = await db.query(
                `SELECT rating
                 FROM ratings
                 WHERE user_id = ? AND store_id = ?`,
                [user_id, storeId]
            );

            if (ratings.length === 0) {
                return res.json({
                    rating: null
                });
            }

            res.json({
                rating: ratings[0].rating
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: "Failed to fetch rating"
            });
        }
    }
);


module.exports = router;