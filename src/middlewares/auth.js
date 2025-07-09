import jwt from 'jsonwebtoken';
export const generarToken = id_usuario =>
  jwt.sign({ id_usuario }, process.env.JWT_SECRET, { expiresIn: '7d' });

export default (req, res, next) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Falta token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Token inválido' }); }
};
