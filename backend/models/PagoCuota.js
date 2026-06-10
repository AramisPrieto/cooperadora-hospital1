import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const PagoCuota = sequelize.define('PagoCuota', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  socio_numero_asociado: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'socio_numero_asociado'
  },
  mes: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 12
    }
  },
  anio: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  monto: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  estado: {
    type: DataTypes.ENUM('pagado', 'pendiente', 'vencido', 'aprobado', 'rechazado'),
    allowNull: false,
    defaultValue: 'pendiente'
  },
  fecha_pago: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metodo_pago: {
    type: DataTypes.ENUM('transferencia', 'efectivo', 'debito'),
    allowNull: true
  },
  mp_payment_id: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  numero_comprobante: {
    type: DataTypes.STRING,
    allowNull: true
  },
  comprobante_url: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'pagos_cuotas',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'idx_pago_cuota_socio_periodo',
      fields: ['socio_numero_asociado', 'anio', 'mes']
    },
    {
      name: 'idx_pago_cuota_mp_payment_id',
      unique: true,
      fields: ['mp_payment_id']
    }
  ]
});

export default PagoCuota;
