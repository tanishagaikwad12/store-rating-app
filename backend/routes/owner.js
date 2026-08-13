const express = require("express");
const db = require("../config/db");
const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateToken, authorizeRoles("OWNER", "STORE_OWNER"));

// Returns only the authenticated owner's stores and their rating summaries.
router.get("/dashboard", async (req, res) => {
    try {
        const [stores] = await db.query(
            `SELECT
                s.id, s.name, s.email, s.address,
                COALESCE(AVG(r.rating), 0) AS average_rating,
                COUNT(r.id) AS total_ratings
             FROM stores s
             LEFT JOIN ratings r ON r.store_id = s.id
             WHERE s.owner_id = ?
             GROUP BY s.id
             ORDER BY s.name ASC`,
            [req.user.id]
        );

        const storeIds = stores.map((store) => store.id);
        const ratingsByStore = new Map();

        if (storeIds.length > 0) {
            const placeholders = storeIds.map(() => "?").join(", ");
            const [ratings] = await db.query(
                `SELECT r.store_id, r.id, r.rating,
                    u.id AS user_id, u.name AS user_name, u.email AS user_email
                 FROM ratings r
                 INNER JOIN users u ON u.id = r.user_id
                 WHERE r.store_id IN (${placeholders})
                 ORDER BY r.id DESC`,
                storeIds
            );

            for (const rating of ratings) {
                const storeRatings = ratingsByStore.get(rating.store_id) || [];
                storeRatings.push(rating);
                ratingsByStore.set(rating.store_id, storeRatings);
            }
        }

        const storesWithRatings = stores.map((store) => ({
            ...store,
            ratings: ratingsByStore.get(store.id) || []
        }));
        const totalRatings = stores.reduce(
            (total, store) => total + Number(store.total_ratings),
            0
        );
        const averageRating = stores.length
            ? stores.reduce(
                (total, store) => total + Number(store.average_rating),
                0
            ) / stores.length
            : 0;

        res.json({
            total_stores: stores.length,
            total_ratings: totalRatings,
            average_rating: averageRating,
            stores: storesWithRatings
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch owner dashboard data" });
    }
});

// Ratings are exposed only after confirming the store belongs to the logged-in owner.
router.get("/stores/:storeId/ratings", async (req, res) => {
    try {
        const { storeId } = req.params;
        const [ownedStore] = await db.query(
            "SELECT id FROM stores WHERE id = ? AND owner_id = ?",
            [storeId, req.user.id]
        );

        if (ownedStore.length === 0) {
            return res.status(404).json({ message: "Store not found" });
        }

        const [ratings] = await db.query(
            `SELECT r.id, r.rating, u.id AS user_id, u.name, u.email, u.address
             FROM ratings r
             INNER JOIN users u ON u.id = r.user_id
             WHERE r.store_id = ?
             ORDER BY r.id DESC`,
            [storeId]
        );

        res.json(ratings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch store ratings" });
    }
});

module.exports = router;
