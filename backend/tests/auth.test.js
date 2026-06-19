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

  describe('POST /forgot-password y POST /reset-password', () => {
    beforeEach(async () => {
      // Registrar un usuario para las pruebas de recuperación
      await request(app)
        .post('/api/auth/register')
        .send({
          ...baseRegisterData,
          email: 'recover@test.com',
          password: 'Password123',
          dni: 87654321
        });
    });

    it('debe responder success al solicitar recuperación para cualquier correo', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'recover@test.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Si el correo está registrado');

      const resNonExistent = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'doesnotexist@test.com' });

      expect(resNonExistent.status).toBe(200);
    });

    it('debe restablecer la contraseña exitosamente usando un token válido', async () => {
      // Solicitar recuperación para generar el token
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'recover@test.com' });

      // Obtener el usuario de la DB para leer el token generado
      const { Usuario } = await import('../models/index.js');
      const user = await Usuario.findOne({ where: { email: 'recover@test.com' } });
      expect(user.reset_password_token).toBeDefined();
      expect(user.reset_password_token).not.toBeNull();

      // Enviar nueva contraseña con el token
      const resReset = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: user.reset_password_token,
          password: 'Newpassword123'
        });

      expect(resReset.status).toBe(200);
      expect(resReset.body.message).toContain('restablecida correctamente');

      // Intentar loguearse con la nueva contraseña
      const resLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'recover@test.com',
          password: 'Newpassword123'
        });

      expect(resLogin.status).toBe(200);
    });

    it('debe fallar al restablecer si el token es inválido', async () => {
      const resReset = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalidtoken123456789',
          password: 'Newpassword123'
        });

      expect(resReset.status).toBe(400);
      expect(resReset.body.error).toContain('inválido o ha expirado');
    });

    it('debe fallar al restablecer si la contraseña es débil', async () => {
      const resReset = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'some_token',
          password: 'weak'
        });

      expect(resReset.status).toBe(400);
      expect(resReset.body.error).toContain('La contraseña debe tener al menos 8 caracteres');
    });
  });
});
