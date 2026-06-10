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
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  apellido: {
    type: DataTypes.STRING,
    allowNull: false
  },
  direccion: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nacionalidad: {
    type: DataTypes.STRING,
    allowNull: false
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fecha_nacimiento: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  genero: {
    type: DataTypes.ENUM('masculino', 'femenino', 'otro'),
    allowNull: false
  },
  metodo_pago: {
    type: DataTypes.ENUM('transferencia', 'efectivo', 'cobrador', 'debito'),
    allowNull: false
  },
  fecha_ultimo_pago: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  localidad: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mp_preapproval_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mp_subscription_status: {
    type: DataTypes.STRING,
    allowNull: true
  },
  monto_cuota: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  cant_cambios_metodo_pago: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  mes_ultimo_cambio_metodo_pago: {
    type: DataTypes.STRING(7),
    allowNull: true
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'perfiles_socios',
  timestamps: true,
  underscored: true
});

export default PerfilSocio;
