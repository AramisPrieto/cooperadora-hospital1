// TEAM_001: Modelo para persistir los reportes de donación por transferencia bancaria
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const DonacionTransferencia = sequelize.define('DonacionTransferencia', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  monto: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'aprobada', 'rechazada'),
    allowNull: false,
    defaultValue: 'pendiente'
  },
  referencia_interna: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
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
  tableName: 'donaciones_transferencia',
  timestamps: true,
  underscored: true
});

export default DonacionTransferencia;
