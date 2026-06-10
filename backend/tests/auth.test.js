import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { initTestDatabase, resetTestDatabase, closeTestConnections } from './helpers/setup.js';
import app from '../index.js';
import { Usuario } from '../models/index.js';

beforeAll(async () => {
  await initTestDatabase();
});

beforeEach(async () => {
  await resetTestDatabase();
});

afterAll(async () => {
  await closeTestConnections();
});

const baseRegisterData = {
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

describe('Rutas de Autenticación (/api/auth)', () => {
  describe('POST /register', () => {
    it('debe registrar un nuevo usuario socio con perfil pendiente', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...baseRegisterData,
          email: 'socio@test.com',
          password: 'Password123',
          dni: 12345678
        });

      expect(res.status).toBe(201);
      expect(res.headers['set-cookie']).toBeDefined();
      const hasTokenCookie = res.headers['set-cookie'].some(cookie => cookie.startsWith('token='));
      expect(hasTokenCookie).toBe(true);
      expect(res.body.user).toHaveProperty('email', 'socio@test.com');
      expect(res.body.user).toHaveProperty('rol', 'socio');
      expect(res.body.user.perfil).toHaveProperty('dni', 12345678);
      expect(res.body.user.perfil).toHaveProperty('estado', 'pendiente');
    });

    it('debe fallar si el email ya existe', async () => {
      // Registrar primero
      await request(app)
        .post('/api/auth/register')
        .send({
          ...baseRegisterData,
          email: 'socio@test.com',
          password: 'Password123',
          dni: 12345678
        });

      // Intentar registrar el mismo email
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...baseRegisterData,
          email: 'socio@test.com',
          password: 'Anotherpassword123',
          dni: 87654321
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Error en el registro. Verifique que sus datos sean correctos o intente recuperar su cuenta si ya estaba registrado.');
    });

    it('debe fallar si el DNI ya existe', async () => {
      // Registrar primero
      await request(app)
        .post('/api/auth/register')
        .send({
          ...baseRegisterData,
          email: 'socio1@test.com',
          password: 'Password123',
          dni: 12345678
        });

      // Intentar registrar con el mismo DNI
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...baseRegisterData,
          email: 'socio2@test.com',
          password: 'Password123',
          dni: 12345678
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Error en el registro. Verifique que sus datos sean correctos o intente recuperar su cuenta si ya estaba registrado.');
    });

    it('debe fallar si el email no es válido', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...baseRegisterData,
          email: 'invalid-email',
          password: 'Password123',
          dni: 12345678
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('formato del email no es válido');
    });

    it('debe fallar si la contraseña es corta', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...baseRegisterData,
          email: 'socio@test.com',
          password: 'short',
          dni: 12345678
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('La contraseña debe tener al menos 8 caracteres');
    });

    it('debe fallar si la contraseña no contiene mayúsculas', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...baseRegisterData,
          email: 'socio@test.com',
          password: 'password123',
          dni: 12345678
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.');
    });

    it('debe fallar si la contraseña no contiene números', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...baseRegisterData,
          email: 'socio@test.com',
          password: 'Password',
          dni: 12345678
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.');
    });

    it('debe fallar si el DNI no está en rango válido', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...baseRegisterData,
          email: 'socio@test.com',
          password: 'Password123',
          dni: 999
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('DNI debe ser un número válido');
    });
  });

  describe('POST /login', () => {
    beforeEach(async () => {
      // Registrar un usuario para los tests de login
      await request(app)
        .post('/api/auth/register')
        .send({
          ...baseRegisterData,
          email: 'user@test.com',
          password: 'Password123',
          dni: 12345678
        });
    });

    it('debe iniciar sesión con credenciales válidas', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'Password123'
        });

      expect(res.status).toBe(200);
      expect(res.headers['set-cookie']).toBeDefined();
      const hasTokenCookie = res.headers['set-cookie'].some(cookie => cookie.startsWith('token='));
      expect(hasTokenCookie).toBe(true);
      expect(res.body).toHaveProperty('message', 'Inicio de sesión exitoso.');
      expect(res.body.user).toHaveProperty('email', 'user@test.com');
    });

    it('debe rechazar el login con contraseña incorrecta', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'Wrongpassword123'
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Credenciales inválidas.');
    });

    it('debe rechazar el login si el email no existe', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Password123'
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Credenciales inválidas.');
    });
  });
});
