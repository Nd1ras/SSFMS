const pool = require("./config/db");

const init = async () => {
	try {
		await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) CHECK (role IN ('admin', 'field_agent')) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

		await pool.query(`
      CREATE TABLE IF NOT EXISTS fields (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        crop_type VARCHAR(50) NOT NULL,
        planting_date DATE NOT NULL,
        current_stage VARCHAR(20) CHECK (current_stage IN ('Planted', 'Growing', 'Ready', 'Harvested')) DEFAULT 'Planted',
        assigned_to INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

		await pool.query(`
      CREATE TABLE IF NOT EXISTS field_updates (
        id SERIAL PRIMARY KEY,
        field_id INTEGER REFERENCES fields(id) ON DELETE CASCADE,
        updated_by INTEGER REFERENCES users(id),
        stage VARCHAR(20) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

		console.log("Database initialized");
		process.exit(0);
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};

init();
