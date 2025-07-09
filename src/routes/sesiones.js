/* Sesiones de concentración */
import { Router } from 'express';
import { body, param, query } from 'express-validator';
import validate from '../middlewares/validate.js';
import auth     from '../middlewares/auth.js';
import pool     from '../db.js';
import sql      from 'mssql';

const r = Router();
r.use(auth);                               // 🔒 requiere JWT

/* POST /api/sesiones
   Crea una sesión "en_curso" */
r.post('/',
  body('id_usuario').isInt(),
  validate,
  async (req, res, next) => {
    try {
      const { id_usuario } = req.body;
      const db = await pool;
      const rs = await db.request()
        .input('id_usuario', sql.Int, id_usuario)
        .query(`
          INSERT INTO sesiones (id_usuario, estado)
          OUTPUT inserted.*
          VALUES (@id_usuario, 'en_curso');
        `);
      res.status(201).json(rs.recordset[0]);
    } catch (e) { next(e); }
  });

/* PATCH /api/sesiones/:id/fin
   Marca la sesión como terminada y calcula minutos */
r.patch('/:id/fin',
  param('id').isInt(),
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const db  = await pool;
      await db.request()
        .input('id', sql.Int, id)
        .query(`
          UPDATE sesiones
          SET  fecha_fin = CURRENT_TIMESTAMP,
               minutos_total = DATEDIFF(MINUTE, fecha_inicio, CURRENT_TIMESTAMP),
               estado = 'completada'
          WHERE id_sesion = @id;
        `);
      const out = await db.request()
        .input('id', sql.Int, id)
        .query('SELECT * FROM sesiones WHERE id_sesion=@id;');
      res.json(out.recordset[0]);
    } catch (e) { next(e); }
  });

/* GET /api/sesiones?usuario=#
   Lista sesiones por usuario (opcional) */
r.get('/',
  query('usuario').optional().isInt(),
  validate,
  async (req, res, next) => {
    try {
      const db = await pool;
      const cond = req.query.usuario ? 'WHERE id_usuario=@u' : '';
      const rs = await db.request()
        .input('u', sql.Int, req.query.usuario || null)
        .query(`SELECT * FROM sesiones ${cond} ORDER BY fecha_inicio DESC;`);
      res.json(rs.recordset);
    } catch (e) { next(e); }
  });

export default r;
