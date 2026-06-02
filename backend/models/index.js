import Usuario from './Usuario.js';
import PerfilSocio from './PerfilSocio.js';
import CampanaEco from './CampanaEco.js';
import DonacionTransferencia from './DonacionTransferencia.js'; // TEAM_001: Importamos el modelo de transferencias

// Establecer relaciones SQL
Usuario.hasOne(PerfilSocio, {
  foreignKey: 'usuario_id_fk',
  as: 'perfilSocio',
  onDelete: 'CASCADE'
});

PerfilSocio.belongsTo(Usuario, {
  foreignKey: 'usuario_id_fk',
  as: 'usuario'
});

// TEAM_001: Definir relaciones para las donaciones por transferencia
Usuario.hasMany(DonacionTransferencia, {
  foreignKey: 'usuario_id',
  as: 'donacionesTransferencia'
});

CampanaEco.hasMany(DonacionTransferencia, {
  foreignKey: 'campana_id',
  as: 'donacionesTransferencia'
});

DonacionTransferencia.belongsTo(Usuario, {
  foreignKey: 'usuario_id',
  as: 'usuario'
});

DonacionTransferencia.belongsTo(CampanaEco, {
  foreignKey: 'campana_id',
  as: 'campana'
});

export {
  Usuario,
  PerfilSocio,
  CampanaEco,
  DonacionTransferencia // TEAM_001: Exportamos para el mashup o controladores
};

