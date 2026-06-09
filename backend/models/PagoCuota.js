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
  underscored: true
});

export default PagoCuota;
