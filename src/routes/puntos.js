/* Sistema de puntos/recompensas */
import { Router } from 'express';
import { body, param, query } from 'express-validator';
import validate from '../middlewares/validate.js';
import auth     from '../middlewares/auth.js';
import pool     from '../db.js';
import sql      from 'mssql';

const r = Router({ mergeParams: true }); // id de usuario viene del path
r.use(auth);

/* POST /api/usuarios/:id/puntos */
r.post('/',
  param('id').isInt(),
  body('puntos').isInt({ min: 1 }),
  body('motivo').optional().isString(),
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { puntos, motivo } = req.body;
      const db = await pool;
      const rs = await db.request()
        .input('u', sql.Int, id)
        .input('p', sql.Int, puntos)
        .input('m', sql.VarChar, motivo ?? null)
        .query(`
          INSERT INTO puntos (id_usuario, puntos_ganados, motivo)
          OUTPUT inserted.*
          VALUES (@u,@p,@m);
        `);
      res.status(201).json(rs.recordset[0]);
    } catch (e) { next(e); }
  });

/* GET /api/usuarios/:id/puntos?desde=YYYY-MM-DD */
r.get('/',
  param('id').isInt(),
  query('desde').optional().isISO8601(),
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { desde } = req.query;
      const db = await pool;
      const cond = desde ? 'AND fecha >= @d' : '';
      const rs = await db.request()
        .input('u', sql.Int, id)
        .input('d', sql.Date, desde || null)
        .query(`
          SELECT * FROM puntos
          WHERE id_usuario=@u ${cond}
          ORDER BY fecha DESC;
        `);
      res.json(rs.recordset);
    } catch (e) { next(e); }
  });

export default r;
