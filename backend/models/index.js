import Usuario from './Usuario.js';
import PerfilSocio from './PerfilSocio.js';
import CampanaEco from './CampanaEco.js';

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

export {
  Usuario,
  PerfilSocio,
  CampanaEco
};
