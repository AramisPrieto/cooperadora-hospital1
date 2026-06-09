import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { initTestDatabase, resetTestDatabase, closeTestConnections } from './helpers/setup.js';
import app from '../index.js';
import { Usuario, PerfilSocio, PagoCuota, DonacionTransferencia, CampanaEco } from '../models/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

let socioToken;
let otherSocioToken;
let noProfileToken;
let socioUser;
let otherSocioUser;
let noProfileUser;
let socioPerfil;
let otherSocioPerfil;
let campana;

beforeAll(async () => {
  await initTestDatabase();
});

beforeEach(async () => {
  await resetTestDatabase();

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const mockSocioFields = {
    nombre: 'TestSocio',
    apellido: 'TestSocio',
    direccion: 'Av. 59 1234',
    localidad: 'Necochea',
    nacionalidad: 'Argentina',
    telefono: '2262112233',
    fecha_nacimiento: '1990-01-01',
    genero: 'otro',
    metodo_pago: 'debito'
  };

  // 1. Crear usuario Socio con Perfil
  socioUser = await Usuario.create({
    email: 'socio@panel.com',
    password_hash: passwordHash,
    rol: 'socio'
  });
  socioPerfil = await PerfilSocio.create({
    ...mockSocioFields,
    usuario_id_fk: socioUser.id,
    dni: 88776655,
    estado: 'activo'
  });
  socioToken = jwt.sign({ id: socioUser.id, email: socioUser.email, rol: socioUser.rol }, JWT_SECRET);

  // 2. Crear otro usuario Socio con Perfil
  otherSocioUser = await Usuario.create({
    email: 'other@panel.com',
    password_hash: passwordHash,
    rol: 'socio'
  });
  otherSocioPerfil = await PerfilSocio.create({
    ...mockSocioFields,
    usuario_id_fk: otherSocioUser.id,
    dni: 44332211,
    estado: 'activo'
  });
  otherSocioToken = jwt.sign({ id: otherSocioUser.id, email: otherSocioUser.email, rol: otherSocioUser.rol }, JWT_SECRET);

  // 3. Crear usuario Socio SIN Perfil
  noProfileUser = await Usuario.create({
    email: 'noprofile@panel.com',
    password_hash: passwordHash,
    rol: 'socio'
  });
  noProfileToken = jwt.sign({ id: noProfileUser.id, email: noProfileUser.email, rol: noProfileUser.rol }, JWT_SECRET);

  // 4. Crear Campaña
  campana = await CampanaEco.create({
    titulo: 'Campaña de Test',
    monto_objetivo: 10000.00,
    monto_actual: 0.00,
    fecha_limite: new Date('2026-12-31'),
    activo: true
  });

  // 5. Crear Cuotas para socioUser
  await PagoCuota.bulkCreate([
    { socio_numero_asociado: socioPerfil.numero_asociado, mes: 1, anio: 2026, monto: 1000.00, estado: 'pagado', fecha_pago: new Date('2026-01-05') },
    { socio_numero_asociado: socioPerfil.numero_asociado, mes: 2, anio: 2026, monto: 1000.00, estado: 'pendiente', fecha_pago: null }
  ]);

  // 6. Crear Donaciones para socioUser
  await DonacionTransferencia.create({
    usuario_id: socioUser.id,
    campana_id: campana.id,
    monto: 5000.00,
    estado: 'pendiente'
  });
});

afterAll(async () => {
  await closeTestConnections();
});

describe('Panel de Socios - Endpoints de Autogestión', () => {
  describe('GET /api/socios/mi-perfil/cuotas', () => {
    it('debe obtener las cuotas del socio autenticado', async () => {
      const res = await request(app)
        .get('/api/socios/mi-perfil/cuotas')
        .set('Authorization', `Bearer ${socioToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('socio');
      expect(res.body.socio).toHaveProperty('numero_asociado', socioPerfil.numero_asociado);
      expect(res.body).toHaveProperty('cuotas');
      expect(res.body.cuotas.length).toBe(2);
      expect(res.body.cuotas[0]).toHaveProperty('estado');
    });

    it('debe devolver 404 si el usuario no tiene perfil de socio', async () => {
      const res = await request(app)
        .get('/api/socios/mi-perfil/cuotas')
        .set('Authorization', `Bearer ${noProfileToken}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'No se encontró un perfil de socio vinculado a este usuario.');
    });

    it('debe devolver 401 si no hay token de autenticación', async () => {
      const res = await request(app)
        .get('/api/socios/mi-perfil/cuotas');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/donaciones/mis-donaciones', () => {
    it('debe obtener las donaciones del socio autenticado', async () => {
      const res = await request(app)
        .get('/api/donaciones/mis-donaciones')
        .set('Authorization', `Bearer ${socioToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toHaveProperty('monto', '5000.00');
      expect(res.body[0].campana).toHaveProperty('titulo', 'Campaña de Test');
    });

    it('debe devolver una lista vacía si el socio no realizó donaciones', async () => {
      const res = await request(app)
        .get('/api/donaciones/mis-donaciones')
        .set('Authorization', `Bearer ${otherSocioToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(0);
    });

    it('debe devolver 401 si no hay token de autenticación', async () => {
      const res = await request(app)
        .get('/api/donaciones/mis-donaciones');

      expect(res.status).toBe(401);
    });
  });
});
