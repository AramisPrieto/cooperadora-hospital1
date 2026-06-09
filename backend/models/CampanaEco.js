import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const CampanaEco = sequelize.define('CampanaEco', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  titulo: { // Agregamos título en SQL para identificación transaccional básica
    type: DataTypes.STRING,
    allowNull: false
  },
  monto_objetivo: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  monto_actual: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  fecha_limite: {
    type: DataTypes.DATE,
    allowNull: true
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  es_campana_del_mes: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'campanas_eco',
  timestamps: true,
  underscored: true
});

export default CampanaEco;
