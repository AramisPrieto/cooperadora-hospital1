import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { initTestDatabase, resetTestDatabase, closeTestConnections } from './helpers/setup.js';
import app from '../index.js';
import { Usuario, PerfilSocio } from '../models/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

let adminToken;
let socioToken;
let anotherSocioToken;
let adminUser;
let socioUser;
let anotherSocioUser;
let socioPerfil;

beforeAll(async () => {
  await initTestDatabase();
});

beforeEach(async () => {
  await resetTestDatabase();

  // Crear usuario Admin
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('adminpass', salt);
  adminUser = await Usuario.create({
    email: 'admin@test.com',
    password_hash: adminPasswordHash,
    rol: 'admin'
  });
  adminToken = jwt.sign({ id: adminUser.id, email: adminUser.email, rol: adminUser.rol }, JWT_SECRET);

  // Crear usuario Socio
  const socioPasswordHash = await bcrypt.hash('sociopass', salt);
  socioUser = await Usuario.create({
    email: 'socio@test.com',
    password_hash: socioPasswordHash,
    rol: 'socio'
  });
  socioPerfil = await PerfilSocio.create({
    usuario_id_fk: socioUser.id,
    dni: 11223344,
    estado: 'pendiente'
  });
  socioToken = jwt.sign({ id: socioUser.id, email: socioUser.email, rol: socioUser.rol }, JWT_SECRET);

  // Crear otro usuario Socio (para pruebas de no autorización)
  anotherSocioUser = await Usuario.create({
    email: 'another@test.com',
    password_hash: socioPasswordHash,
    rol: 'socio'
  });
  await PerfilSocio.create({
    usuario_id_fk: anotherSocioUser.id,
    dni: 55667788,
    estado: 'activo'
  });
  anotherSocioToken = jwt.sign({ id: anotherSocioUser.id, email: anotherSocioUser.email, rol: anotherSocioUser.rol }, JWT_SECRET);
});

afterAll(async () => {
  await closeTestConnections();
});

describe('Rutas de Perfiles de Socio (/api/socios)', () => {
  describe('GET /mi-perfil', () => {
    it('debe obtener el propio perfil de socio', async () => {
      const res = await request(app)
        .get('/api/socios/mi-perfil')
        .set('Authorization', `Bearer ${socioToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('dni', 11223344);
      expect(res.body).toHaveProperty('estado', 'pendiente');
      expect(res.body.usuario).toHaveProperty('email', 'socio@test.com');
    });

    it('debe fallar si no hay token de autenticación', async () => {
      const res = await request(app)
        .get('/api/socios/mi-perfil');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Acceso denegado');
    });
  });

  describe('PUT /:id', () => {
    it('debe permitir a un socio actualizar su propio DNI', async () => {
      const res = await request(app)
        .put(`/api/socios/${socioPerfil.numero_asociado}`)
        .set('Authorization', `Bearer ${socioToken}`)
        .send({
          dni: 99887766
        });

      expect(res.status).toBe(200);
      expect(res.body.socio).toHaveProperty('dni', 99887766);
    });

    it('debe impedir a un socio actualizar el perfil de otro socio', async () => {
      const res = await request(app)
        .put(`/api/socios/${socioPerfil.numero_asociado}`)
        .set('Authorization', `Bearer ${anotherSocioToken}`)
        .send({
          dni: 99887766
        });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error', 'No tienes permiso para modificar este perfil.');
    });

    it('debe impedir a un socio cambiar su propio estado de aprobación', async () => {
      const res = await request(app)
        .put(`/api/socios/${socioPerfil.numero_asociado}`)
        .set('Authorization', `Bearer ${socioToken}`)
        .send({
          estado: 'activo'
        });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error', 'Los socios no pueden cambiar su propio estado de aprobación.');
    });

    it('debe permitir a un admin cambiar el estado de aprobación de un socio', async () => {
      const res = await request(app)
        .put(`/api/socios/${socioPerfil.numero_asociado}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          estado: 'activo'
        });

      expect(res.status).toBe(200);
      expect(res.body.socio).toHaveProperty('estado', 'activo');
    });
  });

  describe('Rutas exclusivas de Administrador', () => {
    it('GET / debe listar todos los socios', async () => {
      const res = await request(app)
        .get('/api/socios')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2); // socioUser y anotherSocioUser
    });

    it('GET / debe fallar si lo intenta un socio', async () => {
      const res = await request(app)
        .get('/api/socios')
        .set('Authorization', `Bearer ${socioToken}`);

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error', 'Permisos insuficientes');
    });

    it('POST / debe permitir a admin crear un perfil de socio manualmente', async () => {
      // Registrar un usuario sin perfil primero
      const salt = await bcrypt.genSalt(10);
      const userHash = await bcrypt.hash('pass', salt);
      const tempUser = await Usuario.create({
        email: 'temp@test.com',
        password_hash: userHash,
        rol: 'socio'
      });

      const res = await request(app)
        .post('/api/socios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          usuario_id_fk: tempUser.id,
          dni: 99990000,
          estado: 'activo'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('dni', 99990000);
      expect(res.body).toHaveProperty('estado', 'activo');
    });

    it('DELETE /:id debe permitir a admin eliminar un perfil de socio', async () => {
      const res = await request(app)
        .delete(`/api/socios/${socioPerfil.numero_asociado}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Perfil de socio eliminado exitosamente.');

      // Verificar que ya no exista
      const dbPerfil = await PerfilSocio.findByPk(socioPerfil.numero_asociado);
      expect(dbPerfil).toBeNull();
    });
  });
});
