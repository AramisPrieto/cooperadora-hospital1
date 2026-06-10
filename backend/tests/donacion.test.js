import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { initTestDatabase, resetTestDatabase, closeTestConnections } from './helpers/setup.js';
import app from '../index.js';
import { Usuario, CampanaEco, DonacionTransferencia } from '../models/index.js';

let mockDonationExternalRef = 'donation_u1_c1';

vi.mock('../services/mpService.js', () => {
  return {
    crearPreferenciaDonacion: vi.fn().mockImplementation(({ campanaTitulo, monto, campanaId, usuarioId }) => {
      mockDonationExternalRef = `donation_u${usuarioId}_c${campanaId}`;
      return Promise.resolve({
        id: 'pref_test_12345',
        initPoint: 'https://sandbox.mercadopago.com.ar/test-checkout-donation',
        sandboxInitPoint: 'https://sandbox.mercadopago.com.ar/test-checkout-donation'
      });
    })
  };
});

vi.mock('mercadopago', async () => {
  const actual = await vi.importActual('mercadopago');
  return {
    ...actual,
    MercadoPagoConfig: class {},
    Payment: class {
      get() {
        return Promise.resolve({
          id: 77778888,
          status: 'approved',
          transaction_amount: 1500,
          external_reference: mockDonationExternalRef,
          date_approved: '2026-06-09T18:00:00.000Z'
        });
      }
    }
  };
});

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

let adminToken;
let socioToken;
let adminUser;
let socioUser;
let testCampana;

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

  // Crear campaña base de prueba con meta de $10,000 y acumulado de $2,000
  testCampana = await CampanaEco.create({
    titulo: 'Campaña Techo Quirófano',
    monto_objetivo: 10000.00,
    monto_actual: 2000.00,
    activo: true
  });
});

afterAll(async () => {
  await closeTestConnections();
});

describe('Rutas de Donaciones y Transferencias (/api/donaciones)', () => {
  describe('POST /campanas/:id/donar-transferencia (Declarar Transferencia)', () => {
    it('debe registrar una declaración de transferencia como pendiente', async () => {
      const res = await request(app)
        .post(`/api/donaciones/campanas/${testCampana.id}/donar-transferencia`)
        .set('Authorization', `Bearer ${socioToken}`)
        .send({ monto: 1500 });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'Declaración de transferencia registrada con éxito.');
      expect(res.body.donacion).toHaveProperty('estado', 'pendiente');
      expect(parseFloat(res.body.donacion.monto)).toBe(1500);
      expect(res.body.donacion).toHaveProperty('campana_id', testCampana.id);
    });

    it('debe fallar si el monto es menor a 1000', async () => {
      const res = await request(app)
        .post(`/api/donaciones/campanas/${testCampana.id}/donar-transferencia`)
        .set('Authorization', `Bearer ${socioToken}`)
        .send({ monto: 500 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('monto mínimo para donar es $1.000');
    });

    it('debe fallar si el monto supera los $10.000.000', async () => {
      const res = await request(app)
        .post(`/api/donaciones/campanas/${testCampana.id}/donar-transferencia`)
        .set('Authorization', `Bearer ${socioToken}`)
        .send({ monto: 15000000 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('monto no puede superar $10.000.000');
    });

    it('debe fallar si la campaña no existe', async () => {
      const res = await request(app)
        .post('/api/donaciones/campanas/99999/donar-transferencia')
        .set('Authorization', `Bearer ${socioToken}`)
        .send({ monto: 1500 });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'La campaña especificada no existe.');
    });

    it('debe fallar si la campaña está inactiva', async () => {
      const inactiveCampana = await CampanaEco.create({
        titulo: 'Campaña Inactiva',
        monto_objetivo: 5000,
        activo: false
      });

      const res = await request(app)
        .post(`/api/donaciones/campanas/${inactiveCampana.id}/donar-transferencia`)
        .set('Authorization', `Bearer ${socioToken}`)
        .send({ monto: 1500 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'No se pueden realizar donaciones a campañas inactivas.');
    });

    // TEST DE LÍMITE DE CAMPAÑA (DECLARACIÓN)
    it('debe fallar si la campaña ya alcanzó su objetivo de recaudación', async () => {
      // Poner la campaña al límite
      testCampana.monto_actual = 10000.00;
      await testCampana.save();

      const res = await request(app)
        .post(`/api/donaciones/campanas/${testCampana.id}/donar-transferencia`)
        .set('Authorization', `Bearer ${socioToken}`)
        .send({ monto: 1500 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'La campaña ya ha alcanzado su objetivo de recaudación.');
    });

    it('debe fallar si el monto declarado supera el saldo restante de la campaña', async () => {
      // El saldo restante es $8,000 ($10,000 - $2,000)
      const res = await request(app)
        .post(`/api/donaciones/campanas/${testCampana.id}/donar-transferencia`)
        .set('Authorization', `Bearer ${socioToken}`)
        .send({ monto: 8000.01 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('El monto donado supera el límite restante de la campaña.');
    });

    it('debe fallar si el numero_comprobante contiene enlaces o URLs', async () => {
      const res = await request(app)
        .post(`/api/donaciones/campanas/${testCampana.id}/donar-transferencia`)
        .set('Authorization', `Bearer ${socioToken}`)
        .send({ monto: 1500, numero_comprobante: 'https://badlink.com' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('No se permiten enlaces o URLs');
    });

    it('debe fallar si el comprobante_url contiene etiquetas HTML o scripts', async () => {
      const res = await request(app)
        .post(`/api/donaciones/campanas/${testCampana.id}/donar-transferencia`)
        .set('Authorization', `Bearer ${socioToken}`)
        .send({ monto: 1500, comprobante_url: 'https://ok.com/<script>alert(1)</script>' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('No se permiten etiquetas HTML o scripts');
    });
  });

  describe('Acciones de Administración de Transferencias', () => {
    let pendingDonacion;

    beforeEach(async () => {
      pendingDonacion = await DonacionTransferencia.create({
        usuario_id: socioUser.id,
        campana_id: testCampana.id,
        monto: 3000.00,
        estado: 'pendiente'
      });
    });

    it('GET /transferencias debe listar las transferencias declaradas para el Admin', async () => {
      const res = await request(app)
        .get('/api/donaciones/transferencias')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toHaveProperty('id', pendingDonacion.id);
      expect(res.body[0].usuario).toHaveProperty('email', 'socio@test.com');
      expect(res.body[0].campana).toHaveProperty('titulo', 'Campaña Techo Quirófano');
    });

    it('PUT /transferencias/:id/aprobar debe aprobar la transferencia, actualizar el acumulado y retornar éxito', async () => {
      const res = await request(app)
        .put(`/api/donaciones/transferencias/${pendingDonacion.id}/aprobar`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body.donacion).toHaveProperty('estado', 'aprobada');
      expect(res.body).toHaveProperty('monto_actual_campana', 5000); // 2000 + 3000

      // Verificar en base de datos
      const dbCampana = await CampanaEco.findByPk(testCampana.id);
      expect(parseFloat(dbCampana.monto_actual)).toBe(5000.00);

      const dbDonacion = await DonacionTransferencia.findByPk(pendingDonacion.id);
      expect(dbDonacion.estado).toBe('aprobada');
    });

    it('PUT /transferencias/:id/rechazar debe rechazar la transferencia sin alterar el acumulado de la campaña', async () => {
      const res = await request(app)
        .put(`/api/donaciones/transferencias/${pendingDonacion.id}/rechazar`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.donacion).toHaveProperty('estado', 'rechazada');

      // Verificar en base de datos que la campaña siga igual
      const dbCampana = await CampanaEco.findByPk(testCampana.id);
      expect(parseFloat(dbCampana.monto_actual)).toBe(2000.00);

      const dbDonacion = await DonacionTransferencia.findByPk(pendingDonacion.id);
      expect(dbDonacion.estado).toBe('rechazada');
    });

    // TEST DE LÍMITE DE CAMPAÑA (APROBACIÓN CONCURRENTE)
    it('debe impedir aprobar una donación si supera el saldo restante de la campaña al momento de procesar', async () => {
      // El saldo restante actual es $8,000.
      // Crear una donación que excede los $8,000 (por ejemplo, $9,000)
      const bigDonacion = await DonacionTransferencia.create({
        usuario_id: socioUser.id,
        campana_id: testCampana.id,
        monto: 9000.00,
        estado: 'pendiente'
      });

      // Intentamos aprobar la donación grande
      const res = await request(app)
        .put(`/api/donaciones/transferencias/${bigDonacion.id}/aprobar`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('supera el límite restante de la campaña');

      // Verificar que sigue en estado pendiente y la campaña no se alteró
      const dbDonacion = await DonacionTransferencia.findByPk(bigDonacion.id);
      expect(dbDonacion.estado).toBe('pendiente');

      const dbCampana = await CampanaEco.findByPk(testCampana.id);
      expect(parseFloat(dbCampana.monto_actual)).toBe(2000.00);
    });
  });

  describe('Donación con Mercado Pago y Webhook', () => {
    it('debe crear una preferencia de pago en Mercado Pago exitosamente', async () => {
      const res = await request(app)
        .post(`/api/donaciones/campanas/${testCampana.id}/donar-mp`)
        .set('Authorization', `Bearer ${socioToken}`)
        .send({ monto: 1500 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', 'pref_test_12345');
      expect(res.body).toHaveProperty('initPoint', 'https://sandbox.mercadopago.com.ar/test-checkout-donation');
    });

    it('debe registrar la donación e incrementar el monto de la campaña al recibir la notificación del webhook', async () => {
      // Registrar que la donación actual es de socioUser en testCampana
      mockDonationExternalRef = `donation_u${socioUser.id}_c${testCampana.id}`;

      const res = await request(app)
        .post('/api/webhooks/mercadopago')
        .set('x-signature', 'ts=123,v1=abc')
        .set('x-request-id', 'req-123')
        .send({
          type: 'payment',
          data: { id: 77778888 }
        });

      expect(res.status).toBe(200);

      // Esperar brevemente para que termine de procesar el async background webhook
      await new Promise(resolve => setTimeout(resolve, 150));

      // La donación debe haberse registrado en base de datos
      const dbDonacion = await DonacionTransferencia.findOne({
        where: { numero_comprobante: '77778888' }
      });
      expect(dbDonacion).not.toBeNull();
      expect(dbDonacion.estado).toBe('aprobada');
      expect(parseFloat(dbDonacion.monto)).toBe(1500);

      // El acumulado de la campaña debe haberse incrementado por $1500 (2000 + 1500 = 3500)
      const dbCampana = await CampanaEco.findByPk(testCampana.id);
      expect(parseFloat(dbCampana.monto_actual)).toBe(3500.00);
    });
  });
});
