/* ───────────────  IMPORTS  ─────────────── */
import express       from 'express';
import dotenv        from 'dotenv';
import fs            from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import swaggerUi     from 'swagger-ui-express';

/* Rutas */
import usersRouter    from './routes/usuarios.js';
import devicesRouter  from './routes/dispositivos.js';
import sessionsRouter from './routes/sesiones.js';
import eventsRouter   from './routes/eventos.js';
import pointsRouter   from './routes/puntos.js';
import alarmsRouter   from './routes/alarmas.js';

/* ───────────────  CONFIG BÁSICA  ─────────────── */
dotenv.config();                          // carga variables .env
const app = express();
app.use(express.json());                  // parsea JSON

/* ───────────────  SWAGGER DOCS  ─────────────── */
const __dirname = dirname(fileURLToPath(import.meta.url));
// Ajusta la ruta según dónde esté swagger.json respecto a src/index.js
const swaggerPath = join(__dirname, '..', 'swagger.json');
const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));

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
const PORT = process.env.PORT || 8080;    // Render define PORT
app.listen(PORT, () =>
  console.log(`🚀 API escuchando en http://localhost:${PORT}`)
);
