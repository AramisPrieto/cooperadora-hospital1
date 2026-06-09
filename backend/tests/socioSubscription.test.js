import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { initTestDatabase, resetTestDatabase, closeTestConnections } from './helpers/setup.js';
import app from '../index.js';
import { Usuario, PerfilSocio, PagoCuota } from '../models/index.js';

// Variable compartida para pasar dinámicamente el ID del socio a los mocks de Mercado Pago
// Debe comenzar con la palabra "mock" para ser permitida dentro de vi.mock por Vitest/Jest
let mockSocioId = '1';

// Mockear el servicio de Mercado Pago para evitar llamadas reales a la API
vi.mock('../services/mpService.js', () => {
  return {
    crearSuscripcionSocio: vi.fn().mockResolvedValue({
      id: 'sub_test_12345',
      init_point: 'https://sandbox.mercadopago.com.ar/test-checkout',
      sandbox_init_point: 'https://sandbox.mercadopago.com.ar/test-checkout',
      status: 'pending'
    }),
    cancelarSuscripcionSocio: vi.fn().mockResolvedValue({
      id: 'sub_test_12345',
      status: 'cancelled'
    }),
    obtenerSuscripcion: vi.fn().mockImplementation(() => Promise.resolve({
      id: 'sub_test_12345',
      external_reference: mockSocioId,
      status: 'authorized',
      auto_recurring: {
        transaction_amount: 2500
      }
    }))
  };
});

// Mockear la clase Payment del SDK de Mercado Pago
vi.mock('mercadopago', async () => {
  const actual = await vi.importActual('mercadopago');
  return {
    ...actual,
    MercadoPagoConfig: class {},
    Payment: class {
      get() {
        return Promise.resolve({
          id: 99998888,
          status: 'approved',
          transaction_amount: 2500,
          external_reference: mockSocioId,
          date_approved: '2026-06-09T18:00:00.000Z'
        });
      }
    }
  };
});

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

let socioToken;
let adminToken;
let socioUser;
let socioPerfil;

const baseSocioProfile = {
  nombre: 'SocioMP',
  apellido: 'SocioMP',
  direccion: 'Av. Siempre Viva 742',
  localidad: 'Necochea',
  nacionalidad: 'Argentina',
  telefono: '2262445566',
  fecha_nacimiento: '1985-05-15',
  genero: 'femenino',
  metodo_pago: 'transferencia'
};

beforeAll(async () => {
  await initTestDatabase();
});

beforeEach(async () => {
  await resetTestDatabase();

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('secretpass', salt);

  // Crear Socio
  socioUser = await Usuario.create({
    email: 'socio_mp@test.com',
    password_hash: passwordHash,
    rol: 'socio'
  });
  
  socioPerfil = await PerfilSocio.create({
    ...baseSocioProfile,
    usuario_id_fk: socioUser.id,
    dni: 22333444,
    estado: 'pendiente'
  });

  // Sincronizar el ID dinámico para los mocks
  mockSocioId = socioPerfil.numero_asociado.toString();

  socioToken = jwt.sign({ id: socioUser.id, email: socioUser.email, rol: socioUser.rol }, JWT_SECRET);

  // Crear Admin
  const adminUser = await Usuario.create({
    email: 'admin_mp@test.com',
    password_hash: passwordHash,
    rol: 'admin'
  });
  adminToken = jwt.sign({ id: adminUser.id, email: adminUser.email, rol: adminUser.rol }, JWT_SECRET);
});

afterAll(async () => {
  await closeTestConnections();
});

describe('Rutas de Suscripciones y Pagos de Socios', () => {

  describe('POST /api/socios/suscripcion/crear', () => {
    it('debe crear una suscripción y actualizar el estado del perfil a pendiente de MP', async () => {
      const res = await request(app)
        .post('/api/socios/suscripcion/crear')
        .set('Authorization', `Bearer ${socioToken}`)
        .send({ monto: 2000 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('preapprovalId', 'sub_test_12345');
      expect(res.body).toHaveProperty('initPoint');

      // Verificar DB
      const updatedSocio = await PerfilSocio.findByPk(socioPerfil.numero_asociado);
      expect(updatedSocio.mp_preapproval_id).toBe('sub_test_12345');
      expect(updatedSocio.mp_subscription_status).toBe('pending');
      expect(updatedSocio.monto_cuota).toBe('2000.00');
      expect(updatedSocio.metodo_pago).toBe('debito');
    });

    it('debe fallar si el monto es menor que el mínimo', async () => {
      process.env.MP_MINIMO_CUOTA = '1500';

      const res = await request(app)
        .post('/api/socios/suscripcion/crear')
        .set('Authorization', `Bearer ${socioToken}`)
        .send({ monto: 1000 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'El monto mínimo de la suscripción es de $1500 ARS.');
    });
  });

  describe('POST /api/socios/suscripcion/cancelar', () => {
    it('debe cancelar una suscripción activa y cambiar el método de pago', async () => {
      // Registrar primero una suscripción activa
      socioPerfil.mp_preapproval_id = 'sub_test_12345';
      socioPerfil.mp_subscription_status = 'authorized';
      socioPerfil.metodo_pago = 'debito';
      await socioPerfil.save();

      const res = await request(app)
        .post('/api/socios/suscripcion/cancelar')
        .set('Authorization', `Bearer ${socioToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Tu suscripción con débito automático ha sido cancelada con éxito.');

      const updatedSocio = await PerfilSocio.findByPk(socioPerfil.numero_asociado);
      expect(updatedSocio.mp_subscription_status).toBe('cancelled');
      expect(updatedSocio.metodo_pago).toBe('transferencia');
    });
  });

  describe('POST /api/socios/mi-perfil/pagos/declarar', () => {
    it('debe permitir a un socio declarar un pago manual por transferencia bancaria', async () => {
      const res = await request(app)
        .post('/api/socios/mi-perfil/pagos/declarar')
        .set('Authorization', `Bearer ${socioToken}`)
        .send({
          monto: 2500,
          numero_comprobante: 'TX-MANUAL-123',
          comprobante_url: 'https://receipts.com/file.png'
        });

      expect(res.status).toBe(201);
      expect(res.body.pago).toHaveProperty('estado', 'pendiente');
      expect(res.body.pago).toHaveProperty('monto', '2500.00');

      // Verificar en base de datos
      const dbPago = await PagoCuota.findOne({ where: { numero_comprobante: 'TX-MANUAL-123' } });
      expect(dbPago).toBeDefined();
      expect(dbPago.perfil_socio_id_fk).toBe(socioPerfil.numero_asociado);
    });
  });

  describe('GET /api/socios/mi-perfil/pagos', () => {
    it('debe listar los pagos realizados por el socio', async () => {
      await PagoCuota.create({
        perfil_socio_id_fk: socioPerfil.numero_asociado,
        monto: 1500,
        metodo_pago: 'efectivo',
        estado: 'aprobado'
      });

      const res = await request(app)
        .get('/api/socios/mi-perfil/pagos')
        .set('Authorization', `Bearer ${socioToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toHaveProperty('monto', '1500.00');
    });
  });

  describe('POST /api/webhooks/mercadopago (Webhook)', () => {
    it('debe procesar notificaciones de tipo preapproval para activar al socio', async () => {
      // Sincronizar preapproval_id inicial
      socioPerfil.mp_preapproval_id = 'sub_test_12345';
      socioPerfil.mp_subscription_status = 'pending';
      await socioPerfil.save();

      const res = await request(app)
        .post('/api/webhooks/mercadopago')
        .send({
          type: 'preapproval',
          data: { id: 'sub_test_12345' }
        });

      // El webhook responde inmediatamente 200
      expect(res.status).toBe(200);

      // Esperar brevemente para que termine de procesar el async background webhook
      await new Promise(resolve => setTimeout(resolve, 100));

      const updatedSocio = await PerfilSocio.findByPk(socioPerfil.numero_asociado);
      expect(updatedSocio.mp_subscription_status).toBe('authorized');
      expect(updatedSocio.estado).toBe('activo');
      expect(updatedSocio.metodo_pago).toBe('debito');
    });

    it('debe procesar notificaciones de tipo payment para registrar el cobro de la cuota', async () => {
      // Preparar socio activo
      socioPerfil.estado = 'activo';
      socioPerfil.metodo_pago = 'debito';
      await socioPerfil.save();

      const res = await request(app)
        .post('/api/webhooks/mercadopago')
        .send({
          type: 'payment',
          data: { id: '99998888' }
        });

      expect(res.status).toBe(200);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Verificar que se guardó el pago
      const dbPago = await PagoCuota.findOne({ where: { mp_payment_id: '99998888' } });
      expect(dbPago).not.toBeNull();
      expect(dbPago.monto).toBe('2500.00');
      expect(dbPago.estado).toBe('aprobado');

      // Verificar que se actualizó la fecha del último pago del socio
      const updatedSocio = await PerfilSocio.findByPk(socioPerfil.numero_asociado);
      expect(updatedSocio.fecha_ultimo_pago).not.toBeNull();
    });
  });
});
