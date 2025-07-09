import { Router } from 'express';
import { body, param } from 'express-validator';
import pool from '../db.js'; import sql from 'mssql';
import auth from '../middlewares/auth.js'; import validate from '../middlewares/validate.js';

const r = Router();
r.use(auth);

/* POST /api/dispositivos */
r.post('/',
  body('tipo').isIn(['collar','pulsera','otro']),
  body('descripcion').optional().isString(),
  validate,
  async (req, res, next) => {
    try {
      const { tipo, descripcion } = req.body;
      const db = await pool;
      const rs = await db.request()
        .input('tipo', sql.VarChar, tipo)
        .input('desc', sql.VarChar, descripcion || null)
        .query('INSERT INTO dispositivos (tipo, descripcion) OUTPUT inserted.* VALUES (@tipo,@desc);');
      res.status(201).json(rs.recordset[0]);
    } catch (e) { next(e); }
  });

/* GET todos */
r.get('/', async (_req, res, next) => {
  try { const rs = await (await pool).request().query('SELECT * FROM dispositivos;');
        res.json(rs.recordset); }
  catch (e) { next(e); }
});

/* GET /:id */
r.get('/:id',
  param('id').isInt(), validate,
  async (req, res, next) => {
    try {
      const rs = await (await pool).request()
        .input('id', sql.Int, req.params.id)
        .query('SELECT * FROM dispositivos WHERE id_dispositivo=@id;');
      if (!rs.recordset[0]) return res.sendStatus(404);
      res.json(rs.recordset[0]);
    } catch (e) { next(e); }
  });

  /* put /:id */
r.put('/:id',
  param('id').isInt(), validate,
  body('tipo').optional().isIn(['collar','pulsera','otro']),
  body('descripcion').optional().isString(),
  async (req, res, next) => {
    try {
      const { tipo, descripcion } = req.body;
      const db = await pool;
      const rs = await db.request()
        .input('id', sql.Int, req.params.id)
        .input('tipo', sql.VarChar, tipo || null)
        .input('desc', sql.VarChar, descripcion || null)
        .query(`UPDATE dispositivos
                SET tipo = COALESCE(@tipo, tipo),
                    descripcion = COALESCE(@desc, descripcion)
                WHERE id_dispositivo = @id;`);
      if (rs.rowsAffected[0] === 0) return res.sendStatus(404);
      res.sendStatus(204);
    } catch (e) { next(e); }
  });
  

/* DELETE /:id */
r.delete('/:id',
  param('id').isInt(), validate,
  async (req, res, next) => {
    try {
      await (await pool).request()
        .input('id', sql.Int, req.params.id)
        .query('DELETE FROM dispositivos WHERE id_dispositivo=@id;');
      res.sendStatus(204);
    } catch (e) { next(e); }
  });
export default r;
