const express = require('express');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { query } = require('../db/connection');

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    console.log('Получен запрос на регистрацию:', req.body);
    const { email, password } = req.body;

    const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
    console.log('Результат проверки существующего пользователя:', existingUser.rows);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const passwordHash = await argon2.hash(password);
    console.log('Пароль захеширован');

    const result = await query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, passwordHash]
    );
    console.log('Пользователь создан:', result.rows[0]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при регистрации:', error);
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

    const passwordMatch = await argon2.verify(user.password_hash, password);
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
    console.error('Ошибка при входе:', error);
    next(error);
  }
});

module.exports = router; 