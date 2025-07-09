/* ───────────────  IMPORTS  ─────────────── */
import express from 'express';
import dotenv  from 'dotenv';
import fs      from 'fs';
import swaggerUi from 'swagger-ui-express';

/* Rutas */
import usersRouter     from './routes/usuarios.js';
import devicesRouter   from './routes/dispositivos.js';
import sessionsRouter  from './routes/sesiones.js';
import eventsRouter    from './routes/eventos.js';
import pointsRouter    from './routes/puntos.js';
import alarmsRouter    from './routes/alarmas.js';

/* ───────────────  CONFIG BÁSICA  ─────────────── */
dotenv.config();                 // carga .env
const app = express();
app.use(express.json());         // parsea JSON

/* ───────────────  SWAGGER DOCS  ─────────────── */
const swaggerDocument = JSON.parse(
  fs.readFileSync(new URL('../swagger.json', import.meta.url))
);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

/* ───────────────  RUTAS  ─────────────── */
app.use('/api/usuarios',                 usersRouter);
app.use('/api/dispositivos',             devicesRouter);
app.use('/api/sesiones',                 sessionsRouter);
app.use('/api/sesiones/:sesionId/eventos', eventsRouter);
app.use('/api/usuarios/:id/puntos',      pointsRouter);
app.use('/api/usuarios/:id/alarmas',     alarmsRouter);

/* ───────────────  MANEJADOR DE ERRORES  ─────────────── */
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

/* ───────────────  ARRANQUE  ─────────────── */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`🚀 API escuchando en http://localhost:${PORT}`)
);
