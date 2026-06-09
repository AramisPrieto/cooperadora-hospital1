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
    allowNull: false,
    validate: {
      min: 1,
      max: 12
    }
  },
  anio: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  estado: {
    type: DataTypes.ENUM('pagado', 'pendiente', 'vencido'),
    allowNull: false,
    defaultValue: 'pendiente'
  },
  fecha_pago: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'pagos_cuotas',
  timestamps: true,
  underscored: true
});

export default PagoCuota;
