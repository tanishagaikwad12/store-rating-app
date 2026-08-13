const express = require("express");
const db = require("../config/db");
const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();


// Get all stores + search
router.get("/", authenticateToken, async (req, res) => {
    try {
        const { search } = req.query;

        let query = `
            SELECT 
                s.id,
                s.name,
                s.email,
                s.address,
                s.owner_id,
                COALESCE(AVG(r.rating), 0) AS average_rating
            FROM stores s
            LEFT JOIN ratings r ON s.id = r.store_id
        `;

        const params = [];

        if (search) {
            query += `
                WHERE s.name LIKE ?
                OR s.email LIKE ?
                OR s.address LIKE ?
            `;

            const searchValue = `%${search}%`;

            params.push(
                searchValue,
                searchValue,
                searchValue
            );
        }

        query += `
            GROUP BY s.id
            ORDER BY s.name ASC
        `;

        const [stores] = await db.query(query, params);

        res.json(stores);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch stores"
        });
    }
});


// Add a new store - Admin only
router.post(
    "/",
    authenticateToken,
    authorizeRoles("ADMIN"),
    async (req, res) => {
        try {
            const { name, email, address, owner_id } = req.body;

            if (!name || !address) {
                return res.status(400).json({
                    message: "Store name and address are required"
                });
            }

            if (address.length > 400) {
                return res.status(400).json({
                    message: "Address cannot exceed 400 characters"
                });
            }

            const [result] = await db.query(
                `INSERT INTO stores
                (name, email, address, owner_id)
                VALUES (?, ?, ?, ?)`,
                [
                    name,
                    email || null,
                    address,
                    owner_id || null
                ]
            );

            res.status(201).json({
                message: "Store added successfully",
                storeId: result.insertId
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: "Failed to add store"
            });
        }
    }
);


module.exports = router;