const pool = require('./config/db');

// Auto-initialize tables on startup
async function initTables() {
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
        assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
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
    
    console.log('Database tables verified');
  } catch (err) {
    console.error('Database init error:', err);
  }
}

initTables();

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const fieldRoutes = require('./routes/fields');
const dashboardRoutes = require('./routes/dashboard');

dotenv.config();
const app = express();

app.use(cors({
    origin: ['https://ssfms.netlify.app', 'http://localhost:5173'],
    credentials: true
  }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/dashboard', dashboardRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));