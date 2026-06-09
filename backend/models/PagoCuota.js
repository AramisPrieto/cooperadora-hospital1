import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const PagoCuota = sequelize.define('PagoCuota', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  perfil_socio_id_fk: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  monto: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  fecha_pago: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  metodo_pago: {
    type: DataTypes.ENUM('transferencia', 'efectivo', 'debito'),
    allowNull: false
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
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'aprobado', 'rechazado'),
    allowNull: false,
    defaultValue: 'aprobado'
  }
}, {
  tableName: 'pagos_cuotas',
  timestamps: true,
  underscored: true
});

export default PagoCuota;
