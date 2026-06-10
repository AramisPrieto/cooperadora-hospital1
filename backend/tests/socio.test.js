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

const baseSocioProfile = {
  nombre: 'SocioTest',
  apellido: 'SocioTest',
  direccion: 'Calle Falsa 123',
  localidad: 'Necochea',
  nacionalidad: 'Argentino',
  telefono: '12345678',
  fecha_nacimiento: '1990-01-01',
  genero: 'masculino',
  metodo_pago: 'transferencia'
};

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
    ...baseSocioProfile,
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
    ...baseSocioProfile,
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

    it('debe rechazar (status 400) si un socio intenta actualizar un campo obligatorio a un string vacío', async () => {
      const res = await request(app)
        .put(`/api/socios/${socioPerfil.numero_asociado}`)
        .set('Authorization', `Bearer ${socioToken}`)
        .send({
          nombre: ''
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('debe rechazar (status 400) si un socio intenta actualizar un campo obligatorio a null', async () => {
      const res = await request(app)
        .put(`/api/socios/${socioPerfil.numero_asociado}`)
        .set('Authorization', `Bearer ${socioToken}`)
        .send({
          apellido: null
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('debe rechazar (status 400) si un socio intenta actualizar un campo obligatorio a espacios en blanco', async () => {
      const res = await request(app)
        .put(`/api/socios/${socioPerfil.numero_asociado}`)
        .set('Authorization', `Bearer ${socioToken}`)
        .send({
          direccion: '    '
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('debe rechazar (status 400) si un admin intenta actualizar un campo obligatorio a null', async () => {
      const res = await request(app)
        .put(`/api/socios/${socioPerfil.numero_asociado}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: null
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('debe rechazar (status 400) si se intenta actualizar el DNI a un largo inválido', async () => {
      const res = await request(app)
        .put(`/api/socios/${socioPerfil.numero_asociado}`)
        .set('Authorization', `Bearer ${socioToken}`)
        .send({
          dni: 12345
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('debe permitir a un socio cambiar su método de pago hasta 3 veces en el mes actual', async () => {
      // 1er cambio
      let res = await request(app)
        .put(`/api/socios/${socioPerfil.numero_asociado}`)
        .set('Authorization', `Bearer ${socioToken}`)
        .send({ metodo_pago: 'debito' });
      expect(res.status).toBe(200);
      expect(res.body.socio.metodo_pago).toBe('debito');
      expect(res.body.socio.cant_cambios_metodo_pago).toBe(1);

      // 2do cambio
      res = await request(app)
        .put(`/api/socios/${socioPerfil.numero_asociado}`)
        .set('Authorization', `Bearer ${socioToken}`)
        .send({ metodo_pago: 'transferencia' });
      expect(res.status).toBe(200);
      expect(res.body.socio.metodo_pago).toBe('transferencia');
      expect(res.body.socio.cant_cambios_metodo_pago).toBe(2);

      // 3er cambio
      res = await request(app)
        .put(`/api/socios/${socioPerfil.numero_asociado}`)
        .set('Authorization', `Bearer ${socioToken}`)
        .send({ metodo_pago: 'cobrador' });
      expect(res.status).toBe(200);
      expect(res.body.socio.metodo_pago).toBe('cobrador');
      expect(res.body.socio.cant_cambios_metodo_pago).toBe(3);
    });

    it('debe denegar (status 400) cuando un socio intenta cambiar su método de pago por 4ta vez en el mes actual', async () => {
      // Forzar contador a 3 en el mes actual
      const currentMonth = new Date().toISOString().substring(0, 7);
      await socioPerfil.update({
        cant_cambios_metodo_pago: 3,
        mes_ultimo_cambio_metodo_pago: currentMonth,
        metodo_pago: 'debito'
      });

      const res = await request(app)
        .put(`/api/socios/${socioPerfil.numero_asociado}`)
        .set('Authorization', `Bearer ${socioToken}`)
        .send({ metodo_pago: 'transferencia' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'No podés cambiar tu método de pago más de 3 veces en el mismo mes.');
    });

    it('debe permitir a un administrador cambiar el método de pago de un socio sin límites', async () => {
      const currentMonth = new Date().toISOString().substring(0, 7);
      await socioPerfil.update({
        cant_cambios_metodo_pago: 3,
        mes_ultimo_cambio_metodo_pago: currentMonth,
        metodo_pago: 'debito'
      });

      const res = await request(app)
        .put(`/api/socios/${socioPerfil.numero_asociado}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ metodo_pago: 'transferencia' });

      expect(res.status).toBe(200);
      expect(res.body.socio.metodo_pago).toBe('transferencia');
      // No debería incrementar para el admin
      expect(res.body.socio.cant_cambios_metodo_pago).toBe(3);
    });

    it('debe reiniciar el contador si el mes cambia', async () => {
      // Simular que el último cambio fue en el mes pasado
      const pastMonth = '2025-05';
      await socioPerfil.update({
        cant_cambios_metodo_pago: 3,
        mes_ultimo_cambio_metodo_pago: pastMonth,
        metodo_pago: 'debito'
      });

      const res = await request(app)
        .put(`/api/socios/${socioPerfil.numero_asociado}`)
        .set('Authorization', `Bearer ${socioToken}`)
        .send({ metodo_pago: 'transferencia' });

      expect(res.status).toBe(200);
      expect(res.body.socio.metodo_pago).toBe('transferencia');
      expect(res.body.socio.cant_cambios_metodo_pago).toBe(1);
      const currentMonth = new Date().toISOString().substring(0, 7);
      expect(res.body.socio.mes_ultimo_cambio_metodo_pago).toBe(currentMonth);
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
          ...baseSocioProfile,
          usuario_id_fk: tempUser.id,
          dni: 99990000,
          estado: 'activo'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('dni', 99990000);
      expect(res.body).toHaveProperty('estado', 'activo');
    });

    it('POST / debe rechazar (status 400) si falta usuario_id_fk', async () => {
      const res = await request(app)
        .post('/api/socios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...baseSocioProfile,
          dni: 99990001
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('POST / debe rechazar (status 400) si el DNI tiene menos de 7 dígitos', async () => {
      const salt = await bcrypt.genSalt(10);
      const userHash = await bcrypt.hash('pass', salt);
      const tempUser = await Usuario.create({
        email: 'temp1@test.com',
        password_hash: userHash,
        rol: 'socio'
      });

      const res = await request(app)
        .post('/api/socios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...baseSocioProfile,
          usuario_id_fk: tempUser.id,
          dni: 123456
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('POST / debe rechazar (status 400) si el DNI tiene más de 8 dígitos', async () => {
      const salt = await bcrypt.genSalt(10);
      const userHash = await bcrypt.hash('pass', salt);
      const tempUser = await Usuario.create({
        email: 'temp2@test.com',
        password_hash: userHash,
        rol: 'socio'
      });

      const res = await request(app)
        .post('/api/socios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...baseSocioProfile,
          usuario_id_fk: tempUser.id,
          dni: 123456789
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('POST / debe rechazar (status 400) si un campo de texto requerido está vacío', async () => {
      const salt = await bcrypt.genSalt(10);
      const userHash = await bcrypt.hash('pass', salt);
      const tempUser = await Usuario.create({
        email: 'temp3@test.com',
        password_hash: userHash,
        rol: 'socio'
      });

      const res = await request(app)
        .post('/api/socios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...baseSocioProfile,
          usuario_id_fk: tempUser.id,
          dni: 99990002,
          nombre: ''
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('POST / debe rechazar (status 400) si un campo de texto requerido tiene solo espacios', async () => {
      const salt = await bcrypt.genSalt(10);
      const userHash = await bcrypt.hash('pass', salt);
      const tempUser = await Usuario.create({
        email: 'temp4@test.com',
        password_hash: userHash,
        rol: 'socio'
      });

      const res = await request(app)
        .post('/api/socios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...baseSocioProfile,
          usuario_id_fk: tempUser.id,
          dni: 99990003,
          apellido: '   '
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
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
