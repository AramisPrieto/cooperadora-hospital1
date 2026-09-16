/**
 * Modelos de Dominio y Contratos de Datos (Frontend)
 */

export type UserRole = 'socio' | 'admin';

export type SocioEstado = 'pendiente' | 'activo' | 'inactivo' | 'rechazado';

export type MetodoPagoSocio = 'transferencia' | 'mercadopago' | 'efectivo';

export type TransferenciaEstado = 'pendiente' | 'aprobada' | 'rechazada';

export type CuotaEstado = 'pendiente' | 'pagado' | 'vencido' | 'cancelado';

export interface PerfilSocio {
  id: number;
  usuario_id: number;
  dni: string;
  telefono?: string;
  direccion?: string;
  fecha_nacimiento?: string;
  profesion?: string;
  monto_cuota: number;
  metodo_pago: MetodoPagoSocio;
  estado: SocioEstado;
  observaciones?: string;
  fecha_alta?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: UserRole;
  activo: boolean;
  token_version?: number;
  perfil?: PerfilSocio;
  createdAt?: string;
  updatedAt?: string;
}

export interface CampanaDetalle {
  id: number;
  campana_id_ref: number;
  equipamiento_info?: string;
  equipamiento_imagen?: string;
  proveedor_nombre?: string;
  presupuesto_adjunto?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CampanaEco {
  id: number;
  titulo: string;
  descripcion: string;
  monto_objetivo: number | string;
  monto_actual: number | string;
  fecha_inicio: string;
  fecha_fin?: string;
  activo: boolean;
  imagen_url?: string;
  detalles?: CampanaDetalle;
  createdAt?: string;
  updatedAt?: string;
}

export interface NoticiaActualidad {
  _id: string;
  titulo: string;
  cuerpo_html: string;
  fecha: string;
  imagen_url?: string;
  autor?: string;
  tags?: string[];
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DonacionTransferencia {
  id: number;
  usuario_id: number;
  campana_id: number;
  monto: number;
  numero_comprobante?: string;
  comprobante_url?: string;
  estado: TransferenciaEstado;
  motivo_rechazo?: string;
  fecha_revision?: string;
  usuario?: Usuario;
  campana?: CampanaEco;
  createdAt: string;
  updatedAt?: string;
}

export interface PagoCuota {
  id: number;
  usuario_id: number;
  periodo: string; // YYYY-MM
  monto: number;
  estado: CuotaEstado;
  metodo_pago: MetodoPagoSocio;
  comprobante_url?: string;
  mp_payment_id?: string;
  usuario?: Usuario;
  createdAt: string;
  updatedAt?: string;
}

export interface SocioStats {
  totalSocios: number;
  sociosActivos: number;
  sociosPendientes: number;
  recaudacionMensualEstimada: number;
}
