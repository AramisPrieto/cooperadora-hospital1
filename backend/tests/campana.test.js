import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { initTestDatabase, resetTestDatabase, closeTestConnections } from './helpers/setup.js';
import app from '../index.js';
import { Usuario, CampanaEco, DonacionTransferencia, PerfilSocio } from '../models/index.js';
import CampanaDetalle from '../models/CampanaDetalle.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

let adminToken;
let socioToken;
let adminUser;
let socioUser;

beforeAll(async () => {
  await initTestDatabase();
});

beforeEach(async () => {
  await resetTestDatabase();

  // Crear usuarios de prueba
  adminUser = await Usuario.create({
    email: 'admin@test.com',
    password_hash: 'hash',
    rol: 'admin'
  });
  adminToken = jwt.sign({ id: adminUser.id, email: adminUser.email, rol: adminUser.rol }, JWT_SECRET);

  socioUser = await Usuario.create({
    email: 'socio@test.com',
    password_hash: 'hash',
    rol: 'socio'
  });
  socioToken = jwt.sign({ id: socioUser.id, email: socioUser.email, rol: socioUser.rol }, JWT_SECRET);
});

afterAll(async () => {
  await closeTestConnections();
});

describe('Rutas de Campañas (/api/campanas)', () => {
  describe('POST / (Crear Campaña)', () => {
    it('debe crear una campaña en base híbrida (SQL + NoSQL) con rol Admin', async () => {
      const res = await request(app)
        .post('/api/campanas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titulo: 'Equipamiento Pediátrico',
          monto_objetivo: 500000.00,
          monto_actual: 0.00,
          testimonios: [{ autor: 'Dr. López', texto: 'Gran campaña' }],
          galeria_rica: { imagenes: ['pediatria1.jpg'], videos: [] },
          obra_status: 'Planeada'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'Campaña creada exitosamente en ambas bases de datos.');
      expect(res.body.campana).toHaveProperty('id');
      expect(res.body.campana).toHaveProperty('titulo', 'Equipamiento Pediátrico');
      expect(res.body.campana.detalles).toHaveProperty('obra_status', 'Planeada');
      expect(res.body.campana.detalles.testimonios[0]).toHaveProperty('autor', 'Dr. López');
    });

    it('debe fallar si los montos son negativos', async () => {
      const res = await request(app)
        .post('/api/campanas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titulo: 'Equipamiento Pediátrico',
          monto_objetivo: -100.00,
          monto_actual: 0.00
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'El monto objetivo debe ser un número no negativo.');
    });

    it('debe denegar la creación a usuarios no administradores', async () => {
      const res = await request(app)
        .post('/api/campanas')
        .set('Authorization', `Bearer ${socioToken}`)
        .send({
          titulo: 'Equipamiento Pediátrico',
          monto_objetivo: 500000.00
        });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error', 'Permisos insuficientes');
    });
  });

  describe('GET / (Listar Campañas Públicas)', () => {
    it('debe retornar la lista de campañas activas (sólo SQL) de manera pública', async () => {
      // Crear una campaña activa y una inactiva
      await CampanaEco.create({ titulo: 'Campaña Activa', monto_objetivo: 100000, activo: true });
      await CampanaEco.create({ titulo: 'Campaña Inactiva', monto_objetivo: 200000, activo: false });

      const res = await request(app)
        .get('/api/campanas');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toHaveProperty('titulo', 'Campaña Activa');
    });
  });

  describe('GET /:id (Data Mashup)', () => {
    it('debe obtener la campaña y fusionar sincrónicamente datos de SQL y NoSQL', async () => {
      // Crear en SQL
      const sqlCampana = await CampanaEco.create({
        titulo: 'Campaña Ambulancia',
        monto_objetivo: 1500000,
        monto_actual: 300000,
        activo: true
      });

      // Crear en NoSQL
      await CampanaDetalle.create({
        campana_id_ref: sqlCampana.id,
        testimonios: [{ autor: 'Vecino Solidario', texto: 'Aportemos todos' }],
        galeria_rica: { imagenes: ['ambulancia.png'], videos: ['amb-video.mp4'] },
        obra_status: 'En Ejecución'
      });

      const res = await request(app)
        .get(`/api/campanas/${sqlCampana.id}`)
        .set('Authorization', `Bearer ${socioToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', sqlCampana.id);
      expect(res.body).toHaveProperty('titulo', 'Campaña Ambulancia');
      expect(res.body).toHaveProperty('monto_objetivo', 1500000);
      expect(res.body).toHaveProperty('monto_actual', 300000);
      // Fusión de NoSQL
      expect(res.body.detalles).toHaveProperty('obra_status', 'En Ejecución');
      expect(res.body.detalles.galeria_rica.imagenes).toContain('ambulancia.png');
      expect(res.body.detalles.testimonios[0]).toHaveProperty('autor', 'Vecino Solidario');
    });

    it('debe retornar valores por defecto si no hay detalles en NoSQL', async () => {
      const sqlCampana = await CampanaEco.create({
        titulo: 'Campaña Sin Detalles',
        monto_objetivo: 50000,
        activo: true
      });

      const res = await request(app)
        .get(`/api/campanas/${sqlCampana.id}`)
        .set('Authorization', `Bearer ${socioToken}`);

      expect(res.status).toBe(200);
      expect(res.body.detalles).toHaveProperty('obra_status', 'No especificado (Sin detalles de campaña)');
      expect(res.body.detalles.testimonios).toEqual([]);
    });
  });

  describe('PUT /:id (Actualizar Campaña)', () => {
    it('debe actualizar campos en SQL y NoSQL', async () => {
      const sqlCampana = await CampanaEco.create({ titulo: 'Campaña Vieja', monto_objetivo: 10000 });
      await CampanaDetalle.create({ campana_id_ref: sqlCampana.id, obra_status: 'Planeada' });

      const res = await request(app)
        .put(`/api/campanas/${sqlCampana.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titulo: 'Campaña Renovada',
          monto_objetivo: 25000,
          obra_status: 'Terminada'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Campaña actualizada exitosamente en bases híbridas.');
      expect(res.body.campana).toHaveProperty('titulo', 'Campaña Renovada');
      expect(res.body.campana.detalles).toHaveProperty('obra_status', 'Terminada');

      // Verificar DB relacional
      const dbSql = await CampanaEco.findByPk(sqlCampana.id);
      expect(dbSql.titulo).toBe('Campaña Renovada');

      // Verificar MongoDB
      const dbNosql = await CampanaDetalle.findOne({ campana_id_ref: sqlCampana.id });
      expect(dbNosql.obra_status).toBe('Terminada');
    });
  });

  describe('DELETE /:id (Eliminar Campaña)', () => {
    it('debe eliminar la campaña de SQL y NoSQL', async () => {
      const sqlCampana = await CampanaEco.create({ titulo: 'Campaña Borrable', monto_objetivo: 1000 });
      await CampanaDetalle.create({ campana_id_ref: sqlCampana.id, obra_status: 'Planeada' });

      const res = await request(app)
        .delete(`/api/campanas/${sqlCampana.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Campaña y sus detalles eliminados de ambas bases de datos.');

      // Verificar no existencia
      expect(await CampanaEco.findByPk(sqlCampana.id)).toBeNull();
      expect(await CampanaDetalle.findOne({ campana_id_ref: sqlCampana.id })).toBeNull();
    });
  });

  describe('Campaña del Mes (es_campana_del_mes)', () => {
    it('debe permitir crear una campaña con es_campana_del_mes: true', async () => {
      const res = await request(app)
        .post('/api/campanas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titulo: 'Campaña del Mes de Test',
          monto_objetivo: 300000.00,
          es_campana_del_mes: true,
          obra_status: 'Planeada'
        });

      expect(res.status).toBe(201);
      expect(res.body.campana).toHaveProperty('es_campana_del_mes', true);
    });

    it('debe garantizar que solo una campaña esté marcada como es_campana_del_mes', async () => {
      // Crear la primera campaña destacada
      const campana1 = await CampanaEco.create({
        titulo: 'Campaña Destacada 1',
        monto_objetivo: 100000,
        es_campana_del_mes: true
      });

      // Crear la segunda campaña destacada a través del endpoint
      const res = await request(app)
        .post('/api/campanas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titulo: 'Campaña Destacada 2',
          monto_objetivo: 200000,
          es_campana_del_mes: true
        });

      expect(res.status).toBe(201);
      expect(res.body.campana).toHaveProperty('es_campana_del_mes', true);

      // Verificar que la primera campaña fue desmarcada
      const dbCampana1 = await CampanaEco.findByPk(campana1.id);
      expect(dbCampana1.es_campana_del_mes).toBe(false);
    });

    it('debe desmarcar otras campañas al actualizar una campaña a es_campana_del_mes: true', async () => {
      const campana1 = await CampanaEco.create({
        titulo: 'Campaña Destacada Anterior',
        monto_objetivo: 100000,
        es_campana_del_mes: true
      });
      const campana2 = await CampanaEco.create({
        titulo: 'Campaña A Destacar',
        monto_objetivo: 200000,
        es_campana_del_mes: false
      });

      const res = await request(app)
        .put(`/api/campanas/${campana2.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titulo: 'Campaña A Destacar Modificada',
          monto_objetivo: 200000,
          es_campana_del_mes: true
        });

      expect(res.status).toBe(200);
      expect(res.body.campana).toHaveProperty('es_campana_del_mes', true);

      // Verificar en DB
      const dbCampana1 = await CampanaEco.findByPk(campana1.id);
      expect(dbCampana1.es_campana_del_mes).toBe(false);
      const dbCampana2 = await CampanaEco.findByPk(campana2.id);
      expect(dbCampana2.es_campana_del_mes).toBe(true);
    });
  });

  describe('GET /:id/donantes (Últimos Donantes)', () => {
    it('debe retornar lista vacía y total 0 si no hay donaciones aprobadas', async () => {
      const campana = await CampanaEco.create({
        titulo: 'Campaña Sin Donantes',
        monto_objetivo: 100000,
        activo: true
      });

      const res = await request(app).get(`/api/campanas/${campana.id}/donantes`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('donantes');
      expect(res.body.donantes).toEqual([]);
      expect(res.body.total).toBe(0);
    });

    it('debe retornar los donantes con iniciales reales, montos y formato de tiempo válido sin NaN', async () => {
      const campana = await CampanaEco.create({
        titulo: 'Campaña Con Donantes',
        monto_objetivo: 500000,
        activo: true
      });

      // Crear socio con nombre y apellido
      const socio = await Usuario.create({
        email: 'donante@test.com',
        password_hash: 'hash',
        rol: 'socio'
      });
      await PerfilSocio.create({
        usuario_id_fk: socio.id,
        nombre: 'Martín',
        apellido: 'Silva',
        dni: 30111222,
        direccion: 'Calle Falsa 123',
        localidad: 'Necochea',
        nacionalidad: 'Argentina',
        telefono: '2262112233',
        fecha_nacimiento: '1990-01-01',
        genero: 'masculino',
        metodo_pago: 'transferencia',
        estado: 'activo'
      });

      // Crear donación aprobada
      await DonacionTransferencia.create({
        usuario_id: socio.id,
        campana_id: campana.id,
        monto: 25000.00,
        estado: 'aprobada'
      });

      const res = await request(app).get(`/api/campanas/${campana.id}/donantes`);
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.donantes.length).toBe(1);
      expect(res.body.donantes[0].iniciales).toBe('M.S.');
      expect(res.body.donantes[0].monto).toBe(25000);
      expect(res.body.donantes[0].timeAgo).not.toContain('NaN');
    });

    it('debe retornar 400 si el ID es inválido', async () => {
      const res = await request(app).get('/api/campanas/invalido/donantes');
      expect(res.status).toBe(400);
    });
  });
});

