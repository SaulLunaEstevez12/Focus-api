/* src/routes/alarmas.js
   Configuración de alarmas por usuario                         */

import { Router } from 'express';
import { body, param } from 'express-validator';
import validate from '../middlewares/validate.js';
import auth     from '../middlewares/auth.js';
import pool     from '../db.js';
import sql      from 'mssql';

const r = Router();
r.use(auth);                // 🔒 requiere token JWT

/* GET /api/usuarios/:id/alarmas
   Devuelve la configuración actual de ese usuario */
r.get('/:id/alarmas',
  param('id').isInt(), validate,
  async (req, res, next) => {
    try {
      const db   = await pool;
      const resp = await db.request()
        .input('id', sql.Int, req.params.id)
        .query('SELECT * FROM alarmas_usuario WHERE id_usuario = @id;');
      if (resp.recordset.length === 0)
        return res.status(404).json({ error: 'No hay alarmas guardadas' });
      res.json(resp.recordset[0]);
    } catch (e) { next(e); }
  });

/* PUT /api/usuarios/:id/alarmas
   Crea o actualiza las preferencias de alarmas */
r.put('/:id/alarmas',
  param('id').isInt(),
  body('tiempo_inactivo_seg').optional().isInt({ min: 10 }),
  body('angulo_max_deg').optional().isFloat({ min: 5, max: 90 }),
  body('long_pomodoro_min').optional().isInt({ min: 1 }),
  body('long_descanso_min').optional().isInt({ min: 1 }),
  validate,
  async (req, res, next) => {
    try {
      const { id }  = req.params;
      const db      = await pool;
      const payload = {
        tiempo_inactivo_seg: req.body.tiempo_inactivo_seg ?? null,
        angulo_max_deg:      req.body.angulo_max_deg      ?? null,
        long_pomodoro_min:   req.body.long_pomodoro_min   ?? null,
        long_descanso_min:   req.body.long_descanso_min   ?? null
      };

      /* UPSERT: si existe → UPDATE; si no → INSERT */
      await db.request()
        .input('id', sql.Int, id)
        .input('ti', sql.Int,    payload.tiempo_inactivo_seg)
        .input('ang',sql.Float,  payload.angulo_max_deg)
        .input('lp', sql.Int,    payload.long_pomodoro_min)
        .input('ld', sql.Int,    payload.long_descanso_min)
        .query(`
MERGE alarmas_usuario AS tgt
USING (SELECT @id AS id_usuario) AS src
ON (tgt.id_usuario = src.id_usuario)
WHEN MATCHED THEN
  UPDATE SET tiempo_inactivo_seg = COALESCE(@ti,  tgt.tiempo_inactivo_seg),
             angulo_max_deg      = COALESCE(@ang, tgt.angulo_max_deg),
             long_pomodoro_min   = COALESCE(@lp,  tgt.long_pomodoro_min),
             long_descanso_min   = COALESCE(@ld,  tgt.long_descanso_min)
WHEN NOT MATCHED THEN
  INSERT (id_usuario, tiempo_inactivo_seg, angulo_max_deg,
          long_pomodoro_min, long_descanso_min)
  VALUES (@id,@ti,@ang,@lp,@ld);
        `);

      /* Devuelve la fila resultante */
      const rs = await db.request()
        .input('id', sql.Int, id)
        .query('SELECT * FROM alarmas_usuario WHERE id_usuario=@id;');
      res.json(rs.recordset[0]);
    } catch (e) { next(e); }
  });

export default r;
