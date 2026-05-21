import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const PerfilSocio = sequelize.define('PerfilSocio', {
  numero_asociado: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuario_id_fk: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  dni: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  fecha_alta: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  estado: {
    type: DataTypes.ENUM('activo', 'pendiente', 'inactivo'),
    allowNull: false,
    defaultValue: 'pendiente'
  }
}, {
  tableName: 'perfiles_socios',
  timestamps: true,
  underscored: true
});

export default PerfilSocio;
