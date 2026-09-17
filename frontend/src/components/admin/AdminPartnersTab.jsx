import React, { useState, useMemo } from 'react';
import PartnerForm from './PartnerForm';
import {
  Users, Search, CheckCircle, XCircle, ChevronDown,
  ChevronUp, User, MapPin, Shield, Trash, Pencil
} from 'lucide-react';

export const AdminPartnersTab = ({
  partners = [],
  loading = false,
  submitting = false,
  onUpdatePartnerStatus,
  onSavePartnerDetails,
  onDeletePartner
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos'); // 'todos' | 'activos' | 'inactivos' | 'no_aprobados'
  const [expandedPartnerId, setExpandedPartnerId] = useState(null);
  const [editingPartnerId, setEditingPartnerId] = useState(null);

  const counts = useMemo(() => {
    return {
      todos: partners.length,
      activos: partners.filter((p) => p.estado === 'activo').length,
      inactivos: partners.filter((p) => p.estado === 'inactivo').length,
      no_aprobados: partners.filter((p) => p.estado === 'pendiente').length
    };
  }, [partners]);

  const filteredPartners = useMemo(() => {
    let result = partners;

    if (statusFilter === 'activos') {
      result = result.filter((part) => part.estado === 'activo');
    } else if (statusFilter === 'inactivos') {
      result = result.filter((part) => part.estado === 'inactivo');
    } else if (statusFilter === 'no_aprobados') {
      result = result.filter((part) => part.estado === 'pendiente');
    }

    const match = search.toLowerCase().trim();
    if (match) {
      result = result.filter((part) => {
        const fullName = `${part.nombre || ''} ${part.apellido || ''}`.toLowerCase();
        const email = (part.usuario?.email || '').toLowerCase();
        const dni = String(part.dni || '');
        const loc = (part.localidad || '').toLowerCase();
        return (
          fullName.includes(match) ||
          email.includes(match) ||
          dni.includes(match) ||
          loc.includes(match)
        );
      });
    }

    return result;
  }, [partners, statusFilter, search]);

  const getEmptyMessage = () => {
    if (search.trim()) {
      return `No se encontraron socios que coincidan con "${search}" en esta vista.`;
    }
    switch (statusFilter) {
      case 'activos':
        return 'No hay socios activos registrados actualmente.';
      case 'inactivos':
        return 'No hay socios inactivos registrados.';
      case 'no_aprobados':
        return 'No hay socios pendientes de aprobación.';
      default:
        return 'No hay perfiles de socios registrados.';
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
      {/* Header & Search */}
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-black text-slate-800 text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-500" />
            Libro Registro de Asociados
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Gestione los estados de aprobación de los socios.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 w-full md:w-64">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o DNI..."
            maxLength={100}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-xs w-full font-semibold text-slate-700"
          />
        </div>
      </div>

      {/* Tabs / Vistas de Socios */}
      <div className="px-5 py-3 bg-slate-50/60 border-b border-slate-100 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter('todos')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            statusFilter === 'todos'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <span>Todos</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
              statusFilter === 'todos' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {counts.todos}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('activos')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            statusFilter === 'activos'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200/80'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                statusFilter === 'activos' ? 'bg-white' : 'bg-emerald-500'
              }`}
            />
            Activos
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
              statusFilter === 'activos' ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {counts.activos}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('inactivos')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            statusFilter === 'inactivos'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200/80'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                statusFilter === 'inactivos' ? 'bg-white' : 'bg-rose-500'
              }`}
            />
            Inactivos
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
              statusFilter === 'inactivos' ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-800'
            }`}
          >
            {counts.inactivos}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('no_aprobados')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            statusFilter === 'no_aprobados'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200/80'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                statusFilter === 'no_aprobados' ? 'bg-white' : 'bg-amber-500'
              }`}
            />
            No aprobados
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
              statusFilter === 'no_aprobados' ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {counts.no_aprobados}
          </span>
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Cargando socios...</div>
      ) : filteredPartners.length === 0 ? (
        <div className="p-12 text-center">
          <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-semibold">{getEmptyMessage()}</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filteredPartners.map((part) => {
            const isExpanded = expandedPartnerId === part.numero_asociado;
            return (
              <div key={part.numero_asociado} className="border-b border-slate-50 last:border-none">
                <div
                  onClick={() => setExpandedPartnerId(isExpanded ? null : part.numero_asociado)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-slate-50/80 transition-colors cursor-pointer animate-fade"
                >
                  <div className="flex items-center gap-4 flex-grow min-w-0 w-full sm:w-auto">
                    <div
                      className={`shrink-0 h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm ${
                        part.estado === 'activo'
                          ? 'bg-emerald-100 text-emerald-700'
                          : part.estado === 'inactivo'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {part.numero_asociado}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {part.nombre && part.apellido
                          ? `${part.nombre} ${part.apellido}`
                          : part.usuario?.email ?? '—'}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-0.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                        <span>DNI: {part.dni}</span>
                        {part.nombre && part.apellido && (
                          <span className="normal-case text-slate-400 font-medium">
                            ({part.usuario?.email})
                          </span>
                        )}
                        {part.localidad && <span>• {part.localidad}</span>}
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0 self-end sm:self-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {part.estado === 'pendiente' ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => onUpdatePartnerStatus(part.numero_asociado, 'activo')}
                          disabled={submitting}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-[11px] font-black uppercase tracking-wider transition-colors disabled:opacity-40"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Aprobar
                        </button>
                        <button
                          onClick={() => onUpdatePartnerStatus(part.numero_asociado, 'inactivo')}
                          disabled={submitting}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-[11px] font-black uppercase tracking-wider transition-colors disabled:opacity-40"
                        >
                          <XCircle className="h-3 w-3" />
                          Rechazar
                        </button>
                      </div>
                    ) : part.estado === 'inactivo' ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-[11px] font-black uppercase tracking-wider">
                          <XCircle className="h-3 w-3" />
                          Inactivo
                        </span>
                        <button
                          onClick={() => onUpdatePartnerStatus(part.numero_asociado, 'activo')}
                          disabled={submitting}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-[11px] font-black uppercase tracking-wider transition-colors disabled:opacity-40"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Activar
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-[11px] font-black uppercase tracking-wider">
                          <CheckCircle className="h-3 w-3" />
                          Activo
                        </span>
                        <button
                          onClick={() => onUpdatePartnerStatus(part.numero_asociado, 'inactivo')}
                          disabled={submitting}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-[11px] font-black uppercase tracking-wider transition-colors disabled:opacity-40"
                        >
                          <XCircle className="h-3 w-3" />
                          Desactivar
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => setExpandedPartnerId(isExpanded ? null : part.numero_asociado)}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 bg-slate-50/50 border-t border-slate-100 space-y-4">
                    {editingPartnerId === part.numero_asociado ? (
                      <PartnerForm
                        partner={part}
                        submitting={submitting}
                        onSave={async (numeroAsociado, cleanedForm) => {
                          await onSavePartnerDetails(numeroAsociado, cleanedForm);
                          setEditingPartnerId(null);
                        }}
                        onCancel={() => setEditingPartnerId(null)}
                      />
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                          {/* Col 1 */}
                          <div className="space-y-2.5">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                              <User className="h-3.5 w-3.5 text-brand-500" />
                              Datos Personales
                            </h4>
                            <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                              <p className="text-slate-600">
                                <span className="font-bold text-slate-700">Nombre:</span> {part.nombre || '—'}
                              </p>
                              <p className="text-slate-600">
                                <span className="font-bold text-slate-700">Apellido:</span> {part.apellido || '—'}
                              </p>
                              <p className="text-slate-600">
                                <span className="font-bold text-slate-700">F. Nacimiento:</span>{' '}
                                {part.fecha_nacimiento
                                  ? new Date(part.fecha_nacimiento + 'T00:00:00').toLocaleDateString('es-AR')
                                  : '—'}
                              </p>
                              <p className="text-slate-600 capitalize">
                                <span className="font-bold text-slate-700">Género:</span> {part.genero || '—'}
                              </p>
                              <p className="text-slate-600">
                                <span className="font-bold text-slate-700">Nacionalidad:</span>{' '}
                                {part.nacionalidad || '—'}
                              </p>
                            </div>
                          </div>

                          {/* Col 2 */}
                          <div className="space-y-2.5">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-brand-500" />
                              Contacto y Ubicación
                            </h4>
                            <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                              <p className="text-slate-600">
                                <span className="font-bold text-slate-700">Teléfono:</span>{' '}
                                {part.telefono || '—'}
                              </p>
                              <p className="text-slate-600">
                                <span className="font-bold text-slate-700">Dirección:</span>{' '}
                                {part.direccion || '—'}
                              </p>
                              <p className="text-slate-600">
                                <span className="font-bold text-slate-700">Localidad:</span>{' '}
                                {part.localidad || '—'}
                              </p>
                            </div>
                          </div>

                          {/* Col 3 */}
                          <div className="space-y-2.5">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                              <Shield className="h-3.5 w-3.5 text-brand-500" />
                              Administración
                            </h4>
                            <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                              <p className="text-slate-600">
                                <span className="font-bold text-slate-700">Método de Pago:</span>{' '}
                                <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md font-bold text-[10px] uppercase tracking-wide capitalize">
                                  {part.metodo_pago || '—'}
                                </span>
                              </p>
                              <p className="text-slate-600">
                                <span className="font-bold text-slate-700">Último Pago:</span>{' '}
                                {part.fecha_ultimo_pago
                                  ? new Date(part.fecha_ultimo_pago + 'T00:00:00').toLocaleDateString('es-AR')
                                  : '—'}
                              </p>
                              <p className="text-slate-600">
                                <span className="font-bold text-slate-700">Alta Sistema:</span>{' '}
                                {new Date(part.fecha_alta).toLocaleDateString('es-AR')}
                              </p>
                              <div className="mt-2 pt-2 border-t border-slate-100 text-slate-500">
                                <span className="font-black text-slate-600 text-[10px] uppercase tracking-wider block mb-0.5">
                                  Observaciones:
                                </span>
                                <p className="italic leading-normal">
                                  {part.observaciones || 'Sin observaciones registradas.'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex justify-end gap-2 border-t border-slate-200/60 pt-3">
                          <button
                            type="button"
                            onClick={() => onDeletePartner(part.numero_asociado)}
                            disabled={submitting}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-[11px] font-black uppercase tracking-wider transition-colors disabled:opacity-40"
                          >
                            <Trash className="h-3.5 w-3.5" />
                            Eliminar Socio
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPartnerId(part.numero_asociado)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl text-[11px] font-black uppercase tracking-wider transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Editar Datos
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default AdminPartnersTab;
