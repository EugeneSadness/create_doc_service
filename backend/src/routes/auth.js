const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../db/connection');

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result = await query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, passwordHash]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});


router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    

    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 