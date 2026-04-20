const express = require("express");
const pool = require("../config/db");
const { authenticate, authorize } = require("../middleware/auth");
const router = express.Router();

// Get all fields (admin sees all, agent sees assigned)
router.get("/", authenticate, async (req, res) => {
	try {
		let query = `
      SELECT f.*, u.username as agent_name,
        (SELECT MAX(created_at) FROM field_updates WHERE field_id = f.id) as last_updated
      FROM fields f
      LEFT JOIN users u ON f.assigned_to = u.id
    `;
		let params = [];

		if (req.user.role === "field_agent") {
			query += " WHERE f.assigned_to = $1";
			params.push(req.user.id);
		}

		query += " ORDER BY f.created_at DESC";

		const result = await pool.query(query, params);

		// Compute status
		const fields = result.rows.map((field) => ({
			...field,
			status: computeStatus(field),
		}));

		res.json(fields);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Get single field with updates
router.get("/:id", authenticate, async (req, res) => {
	try {
		const fieldResult = await pool.query(
			`
      SELECT f.*, u.username as agent_name 
      FROM fields f 
      LEFT JOIN users u ON f.assigned_to = u.id 
      WHERE f.id = $1
    `,
			[req.params.id],
		);

		if (fieldResult.rows.length === 0)
			return res.status(404).json({ error: "Field not found" });

		const field = fieldResult.rows[0];
		if (
			req.user.role === "field_agent" &&
			field.assigned_to !== req.user.id
		) {
			return res.status(403).json({ error: "Forbidden" });
		}

		const updatesResult = await pool.query(
			`
      SELECT fu.*, u.username as updater_name
      FROM field_updates fu
      JOIN users u ON fu.updated_by = u.id
      WHERE fu.field_id = $1
      ORDER BY fu.created_at DESC
    `,
			[req.params.id],
		);

		res.json({
			...field,
			status: computeStatus(field),
			updates: updatesResult.rows,
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Create field (admin only)
router.post("/", authenticate, authorize("admin"), async (req, res) => {
	const { name, crop_type, planting_date, assigned_to } = req.body;
	try {
		const result = await pool.query(
			`
      INSERT INTO fields (name, crop_type, planting_date, current_stage, assigned_to)
      VALUES ($1, $2, $3, 'Planted', $4)
      RETURNING *
    `,
			[name, crop_type, planting_date, assigned_to || null],
		);

		res.status(201).json(result.rows[0]);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Update field stage (agent for assigned, admin for any)
router.post("/:id/updates", authenticate, async (req, res) => {
	const { stage, notes } = req.body;
	const fieldId = req.params.id;

	try {
		const fieldResult = await pool.query(
			"SELECT * FROM fields WHERE id = $1",
			[fieldId],
		);
		if (fieldResult.rows.length === 0)
			return res.status(404).json({ error: "Field not found" });

		const field = fieldResult.rows[0];
		if (
			req.user.role === "field_agent" &&
			field.assigned_to !== req.user.id
		) {
			return res.status(403).json({ error: "Forbidden" });
		}

		// Validate stage transition
		const validStages = ["Planted", "Growing", "Ready", "Harvested"];
		if (!validStages.includes(stage)) {
			return res.status(400).json({ error: "Invalid stage" });
		}

		const currentIdx = validStages.indexOf(field.current_stage);
		const newIdx = validStages.indexOf(stage);
		if (newIdx < currentIdx) {
			return res.status(400).json({ error: "Cannot revert stage" });
		}

		await pool.query("BEGIN");

		await pool.query(
			`
      INSERT INTO field_updates (field_id, updated_by, stage, notes)
      VALUES ($1, $2, $3, $4)
    `,
			[fieldId, req.user.id, stage, notes],
		);

		await pool.query(
			`
      UPDATE fields SET current_stage = $1, updated_at = NOW() WHERE id = $2
    `,
			[stage, fieldId],
		);

		await pool.query("COMMIT");

		res.json({ message: "Field updated successfully" });
	} catch (err) {
		await pool.query("ROLLBACK");
		res.status(500).json({ error: err.message });
	}
});

// Delete field (admin only)
router.delete("/:id", authenticate, authorize("admin"), async (req, res) => {
	try {
		await pool.query("DELETE FROM fields WHERE id = $1", [req.params.id]);
		res.json({ message: "Field deleted" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

function computeStatus(field) {
	if (field.current_stage === "Harvested") return "Completed";

	const lastUpdate =
		field.last_updated || field.updated_at || field.created_at;
	const daysSinceUpdate = Math.floor(
		(new Date() - new Date(lastUpdate)) / (1000 * 60 * 60 * 24),
	);
	const daysSincePlanting = Math.floor(
		(new Date() - new Date(field.planting_date)) / (1000 * 60 * 60 * 24),
	);

	// At Risk if no update in 14 days or planted > 120 days ago and not harvested
	if (daysSinceUpdate > 14 || daysSincePlanting > 120) return "At Risk";

	return "Active";
}

module.exports = router;
