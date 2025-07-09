import { Router } from 'express';
import { body } from 'express-validator';
import pool from '../db.js';
import sql from 'mssql';
import validate from '../middlewares/validate.js';
import { generarToken } from '../middlewares/auth.js';
import bcrypt from 'bcryptjs';

const r = Router();

/* Registro */
r.post('/register',
  body('nombre').notEmpty(),
  body('correo').isEmail(),
  body('password').isLength({ min: 6 }),
  validate,
  async (req, res, next) => {
    try {
      const { nombre, correo, password } = req.body;
      const hash = await bcrypt.hash(password, 10);
      const db = await pool;
      const rs = await db.request()
        .input('nombre', sql.VarChar, nombre)
        .input('correo', sql.VarChar, correo)
        .input('pass',  sql.VarChar, hash)
        .query(`INSERT INTO usuarios (nombre, correo, password)
                OUTPUT inserted.id_usuario
                VALUES (@nombre,@correo,@pass);`);
      const id = rs.recordset[0].id_usuario;
      res.status(201).json({ token: generarToken(id) });
    } catch (e) { next(e); }
  });

/* Login */
r.post('/login',
  body('correo').isEmail(), body('password').exists(), validate,
  async (req, res, next) => {
    try {
      const { correo, password } = req.body;
      const db = await pool;
      const rs = await db.request()
        .input('correo', sql.VarChar, correo)
        .query('SELECT id_usuario, password FROM usuarios WHERE correo=@correo;');
      const u = rs.recordset[0];
      if (!u || !(await bcrypt.compare(password, u.password)))
        return res.status(400).json({ error: 'Credenciales inválidas' });
      res.json({ token: generarToken(u.id_usuario) });
    } catch (e) { next(e); }
  });

export default r;
