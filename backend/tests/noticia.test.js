import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { initTestDatabase, resetTestDatabase, closeTestConnections } from './helpers/setup.js';
import app from '../index.js';
import { Usuario } from '../models/index.js';
import NoticiaActualidad from '../models/NoticiaActualidad.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

let adminToken;
let adminUser;

beforeAll(async () => {
  await initTestDatabase();
});

beforeEach(async () => {
  await resetTestDatabase();

  adminUser = await Usuario.create({
    email: 'admin@test.com',
    password_hash: 'hash',
    rol: 'admin'
  });
  adminToken = jwt.sign({ id: adminUser.id, email: adminUser.email, rol: adminUser.rol }, JWT_SECRET);
});

afterAll(async () => {
  await closeTestConnections();
});

describe('Rutas de Noticias (/api/noticias)', () => {
  describe('POST / (Crear Noticia)', () => {
    it('debe permitir crear una noticia a un administrador', async () => {
      const res = await request(app)
        .post('/api/noticias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titulo: 'Inauguración de Sala',
          cuerpo_html: '<p>Nueva sala pediátrica disponible.</p>',
          tags: ['hospital', 'pediatria'],
          multimedia: ['sala.jpg']
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('titulo', 'Inauguración de Sala');
      expect(res.body.tags).toContain('pediatria');
    });
  });

  describe('GET / (Listar Noticias con Búsqueda)', () => {
    beforeEach(async () => {
      // Crear noticias de prueba
      await NoticiaActualidad.create({
        titulo: 'Donación de Equipamiento',
        cuerpo_html: 'Recibimos nuevos insumos médicos.',
        tags: ['donacion', 'insumos']
      });

      await NoticiaActualidad.create({
        titulo: 'Campaña Vacunación',
        cuerpo_html: 'Inicia la campaña anual de gripe.',
        tags: ['vacunas', 'salud']
      });
    });

    it('debe listar todas las noticias ordenadas por fecha descendente', async () => {
      const res = await request(app)
        .get('/api/noticias');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it('debe filtrar noticias por término de búsqueda en título', async () => {
      const res = await request(app)
        .get('/api/noticias?search=Vacuna');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].titulo).toBe('Campaña Vacunación');
    });

    it('debe filtrar noticias por término de búsqueda en cuerpo html', async () => {
      const res = await request(app)
        .get('/api/noticias?search=insumos');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].titulo).toBe('Donación de Equipamiento');
    });

    it('debe filtrar noticias por tag', async () => {
      const res = await request(app)
        .get('/api/noticias?search=salud');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].titulo).toBe('Campaña Vacunación');
    });
  });

  describe('GET /:id (Detalle de Noticia)', () => {
    it('debe retornar los detalles de una noticia por su ID', async () => {
      const noticia = await NoticiaActualidad.create({
        titulo: 'Detalle Noticia',
        cuerpo_html: 'Cuerpo descriptivo.'
      });

      const res = await request(app)
        .get(`/api/noticias/${noticia._id}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('titulo', 'Detalle Noticia');
    });

    it('debe retornar 404 si la noticia no existe', async () => {
      const fakeId = '507f1f77bcf86cd799439011'; // ID de mongo válido sintácticamente pero inexistente
      const res = await request(app)
        .get(`/api/noticias/${fakeId}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Noticia no encontrada.');
    });
  });

  describe('PUT /:id (Actualizar Noticia)', () => {
    it('debe permitir modificar campos por administrador', async () => {
      const noticia = await NoticiaActualidad.create({
        titulo: 'Título Original',
        cuerpo_html: 'Cuerpo original.'
      });

      const res = await request(app)
        .put(`/api/noticias/${noticia._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titulo: 'Título Modificado',
          tags: ['nuevo']
        });

      expect(res.status).toBe(200);
      expect(res.body.noticia).toHaveProperty('titulo', 'Título Modificado');
      expect(res.body.noticia.tags).toContain('nuevo');

      // Verificar en base de datos NoSQL
      const dbNoticia = await NoticiaActualidad.findById(noticia._id);
      expect(dbNoticia.titulo).toBe('Título Modificado');
    });
  });

  describe('DELETE /:id (Eliminar Noticia)', () => {
    it('debe eliminar la noticia de la base de datos NoSQL', async () => {
      const noticia = await NoticiaActualidad.create({
        titulo: 'Noticia a Borrar',
        cuerpo_html: 'Eliminar esta noticia.'
      });

      const res = await request(app)
        .delete(`/api/noticias/${noticia._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Noticia eliminada correctamente.');

      // Verificar en DB
      const dbNoticia = await NoticiaActualidad.findById(noticia._id);
      expect(dbNoticia).toBeNull();
    });
  });
});
