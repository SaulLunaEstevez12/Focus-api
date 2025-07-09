/* Eventos dentro de una sesión */
import { Router } from 'express';
import { body, param } from 'express-validator';
import validate from '../middlewares/validate.js';
import auth     from '../middlewares/auth.js';
import pool     from '../db.js';
import sql      from 'mssql';

/* mergeParams: true → usar req.params.sesionId heredado */
const r = Router({ mergeParams: true });
r.use(auth);

/* POST /api/sesiones/:sesionId/eventos */
r.post('/',
  param('sesionId').isInt(),
  body('tipo_evento')
    .isIn(['inclinacion','inactividad','pomodoro_inicio',
           'pomodoro_descanso','alerta_generada']),
  body('gravedad').optional().isInt({ min: 0, max: 5 }),
  body('descripcion').optional().isString(),
  validate,
  async (req, res, next) => {
    try {
      const { sesionId } = req.params;
      const { tipo_evento, gravedad, descripcion } = req.body;
      const db = await pool;
      const rs = await db.request()
        .input('id',   sql.Int, sesionId)
        .input('tipo', sql.VarChar, tipo_evento)
        .input('grav', sql.Int, gravedad ?? null)
        .input('desc', sql.VarChar, descripcion ?? null)
        .query(`
          INSERT INTO eventos (id_sesion, tipo_evento, gravedad, descripcion)
          OUTPUT inserted.*
          VALUES (@id, @tipo, @grav, @desc);
        `);
      res.status(201).json(rs.recordset[0]);
    } catch (e) { next(e); }
  });

/* GET /api/sesiones/:sesionId/eventos */
r.get('/',
  param('sesionId').isInt(),
  validate,
  async (req, res, next) => {
    try {
      const db = await pool;
      const rs = await db.request()
        .input('id', sql.Int, req.params.sesionId)
        .query('SELECT * FROM eventos WHERE id_sesion=@id ORDER BY timestamp ASC;');
      res.json(rs.recordset);
    } catch (e) { next(e); }
  });

export default r;
