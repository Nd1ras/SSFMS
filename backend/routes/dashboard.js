const express = require("express");
const pool = require("../config/db");
const { authenticate, authorize } = require("../middleware/auth");
const router = express.Router();

router.get("/", authenticate, async (req, res) => {
	try {
		let fieldQuery = "SELECT * FROM fields";
		let params = [];

		if (req.user.role === "field_agent") {
			fieldQuery += " WHERE assigned_to = $1";
			params.push(req.user.id);
		}

		const fieldsResult = await pool.query(fieldQuery, params);
		const fields = fieldsResult.rows;

		const total = fields.length;
		const harvested = fields.filter(
			(f) => f.current_stage === "Harvested",
		).length;
		const active = fields.filter((f) => {
			if (f.current_stage === "Harvested") return false;
			const lastUpdate = f.updated_at || f.created_at;
			const daysSince = Math.floor(
				(new Date() - new Date(lastUpdate)) / (1000 * 60 * 60 * 24),
			);
			return daysSince <= 14;
		}).length;
		const atRisk = total - harvested - active;

		const byCrop = {};
		fields.forEach((f) => {
			byCrop[f.crop_type] = (byCrop[f.crop_type] || 0) + 1;
		});

		const byStage = {
			Planted: fields.filter((f) => f.current_stage === "Planted").length,
			Growing: fields.filter((f) => f.current_stage === "Growing").length,
			Ready: fields.filter((f) => f.current_stage === "Ready").length,
			Harvested: fields.filter((f) => f.current_stage === "Harvested")
				.length,
		};

		// Recent updates
		let updatesQuery = `
      SELECT fu.*, f.name as field_name, u.username as updater_name
      FROM field_updates fu
      JOIN fields f ON fu.field_id = f.id
      JOIN users u ON fu.updated_by = u.id
    `;
		if (req.user.role === "field_agent") {
			updatesQuery += " WHERE f.assigned_to = $1";
		}
		updatesQuery += " ORDER BY fu.created_at DESC LIMIT 5";

		const updatesResult = await pool.query(
			updatesQuery,
			req.user.role === "field_agent" ? [req.user.id] : [],
		);

		res.json({
			summary: { total, active, atRisk, completed: harvested },
			byCrop,
			byStage,
			recentUpdates: updatesResult.rows,
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

module.exports = router;
