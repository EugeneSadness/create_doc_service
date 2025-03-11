const express = require('express');
const { query } = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');
const { analyzeRepository } = require('../services/repositoryAnalyzer');

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { repository_url, name } = req.body;
    
    const result = await query(
      'INSERT INTO projects (user_id, repository_url, name) VALUES ($1, $2, $3) RETURNING *',
      [req.user.userId, repository_url, name]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/generate', async (req, res, next) => {
  try {
    const projectId = req.params.id;
    
    const projectResult = await query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, req.user.userId]
    );
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const project = projectResult.rows[0];
    
    const documentationContent = await analyzeRepository(project.repository_url);
    
    // Save documentation to database
    const docResult = await query(
      'INSERT INTO documentation (project_id, content, version) VALUES ($1, $2, $3) RETURNING *',
      [projectId, documentationContent, '1.0']
    );
    
    await query(
      'UPDATE projects SET last_analyzed_at = NOW() WHERE id = $1',
      [projectId]
    );
    
    res.status(201).json(docResult.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.get('/:id/documentation', async (req, res, next) => {
  try {
    const projectId = req.params.id;
    
    const projectResult = await query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, req.user.userId]
    );
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const docResult = await query(
      'SELECT * FROM documentation WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1',
      [projectId]
    );
    
    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Documentation not found' });
    }
    
    res.json(docResult.rows[0]);
  } catch (error) {
    next(error);
  }
});

module.exports = router; 