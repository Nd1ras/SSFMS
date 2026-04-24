const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const router = express.Router();

async function seedUsers() {
	const adminHash = await bcrypt.hash("admin123", 10);
	const agentHash = await bcrypt.hash("agent123", 10);

	await pool.query(
		`
      INSERT INTO users (username, password_hash, role) 
      VALUES ('admin', $1, 'admin'), ('agent1', $2, 'field_agent')
      ON CONFLICT DO NOTHING
    `,
		[adminHash, agentHash],
	);
}

// Seed users for demo
router.post("/seed", async (req, res) => {
	try {
		await seedUsers();
		res.json({ message: "Users seeded" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.post("/login", async (req, res) => {
	const { username, password } = req.body;
	try {
		const result = await pool.query(
			"SELECT * FROM users WHERE username = $1",
			[username],
		);
		const user = result.rows[0];
		if (!user || !(await bcrypt.compare(password, user.password_hash))) {
			return res.status(400).json({ error: "Invalid credentials" });
		}

		const token = jwt.sign(
			{ id: user.id, username: user.username, role: user.role },
			process.env.JWT_SECRET || "secret",
			{ expiresIn: "24h" },
		);

		res.json({
			token,
			user: { id: user.id, username: user.username, role: user.role },
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

module.exports = router;
module.exports.seed = seedUsers;
