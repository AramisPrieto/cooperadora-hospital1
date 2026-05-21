import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import CampaignCard from '../components/CampaignCard';
import { Newspaper, Heart, Search, Users, ShieldAlert, Award, FileText } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState([]);
  const [news, setNews] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Estados para procesar donaciones en tiempo real
  const [donationAmount, setDonationAmount] = useState('');
  const [donationSuccess, setDonationSuccess] = useState('');
  const [donationError, setDonationError] = useState('');
  const [submittingDonation, setSubmittingDonation] = useState(false);
  
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // Acción al presionar "Ver más" en una campaña (Cero Anonimato: Requiere JWT)
  const handleViewCampaignDetail = async (id) => {
    if (!token) {
      // Redirigir a login con aviso si es anónimo
      navigate('/login?redirect=campana&id=' + id);
      return;
    }

    try {
      setErrorMsg('');
      const res = await api.get(`/campanas/${id}`); // Endpoint Data Mashup protegido
      setSelectedCampaign(res.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('No se pudieron obtener los detalles enriquecidos de esta campaña.');
    }
  };

  // Cargar campañas y noticias públicas
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await api.get('/campanas');
        setCampaigns(res.data);
        
        // Si hay una campaña en la URL para abrir y el usuario está logueado, la abrimos automáticamente
        const viewId = searchParams.get('view');
        if (viewId) {
          if (localStorage.getItem('token')) {
            const detailRes = await api.get(`/campanas/${viewId}`);
            setSelectedCampaign(detailRes.data);
          }
          // Limpiar el parámetro de la URL sin recargar
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('view');
          setSearchParams(newParams);
        }
      } catch (err) {
        console.error('Error cargando campañas:', err);
      } finally {
        setLoadingCampaigns(false);
      }
    };

    const fetchNews = async () => {
      try {
        const res = await api.get('/noticias');
        setNews(res.data);
      } catch (err) {
        console.error('Error cargando noticias:', err);
      } finally {
        setLoadingNews(false);
      }
    };

    fetchCampaigns();
    fetchNews();
  }, [searchParams]);

  // Búsqueda de noticias por texto
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoadingNews(true);
    try {
      const res = await api.get(`/noticias?search=${searchQuery}`);
      setNews(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNews(false);
    }
  };

  // Cerrar modal y limpiar estados de donación
  const handleCloseModal = () => {
    setSelectedCampaign(null);
    setDonationAmount('');
    setDonationSuccess('');
    setDonationError('');
  };

  // Enviar donación transaccional al Backend (PostgreSQL)
  const handleDonate = async (e) => {
    e.preventDefault();
    if (!donationAmount || isNaN(donationAmount) || parseFloat(donationAmount) <= 0) {
      setDonationError('Por favor, ingresa un monto válido mayor a 0.');
      return;
    }

    setSubmittingDonation(true);
    setDonationError('');
    setDonationSuccess('');

    try {
      const res = await api.post(`/campanas/${selectedCampaign.id}/donar`, {
        monto: parseFloat(donationAmount)
      });
      
      setDonationSuccess(`¡Donación de $${parseFloat(donationAmount).toLocaleString('es-AR')} realizada con éxito!`);
      setDonationAmount('');
      
      // Actualizar el monto de la campaña seleccionada en tiempo real (modal)
      setSelectedCampaign(prev => ({
        ...prev,
        monto_actual: res.data.monto_actual
      }));

      // Actualizar en la lista general de campañas de Home (en tiempo real)
      setCampaigns(prev => prev.map(c => 
        c.id === selectedCampaign.id 
          ? { ...c, monto_actual: res.data.monto_actual } 
          : c
      ));

    } catch (err) {
      console.error('Error al donar:', err);
      setDonationError(err.response?.data?.error || 'Error al procesar la donación en el servidor.');
    } finally {
      setSubmittingDonation(false);
    }
  };

  // Manejadores de acciones del Hero (Smart Navigation)
  const handleHeroAssociate = () => {
    if (!token) {
      navigate('/login');
    } else if (user?.rol === 'admin') {
      navigate('/admin');
    } else {
      document.getElementById('campanas-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleHeroDonate = () => {
    if (!token) {
      navigate('/login');
    } else if (campaigns.length > 0) {
      handleViewCampaignDetail(campaigns[0].id);
    } else {
      document.getElementById('campanas-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div class="flex-grow bg-slate-50">
      {/* 1. HERO SECTION (Wireframe inspired) */}
      <section class="relative bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white py-20 px-4 overflow-hidden">
        {/* Glow decoration */}
        <div class="absolute -top-40 -left-40 h-96 w-96 bg-teal-500/20 rounded-full filter blur-[100px]"></div>
        <div class="absolute -bottom-40 -right-40 h-96 w-96 bg-accent-red/10 rounded-full filter blur-[100px]"></div>

        <div class="max-w-7xl mx-auto grid md:grid-cols-12 gap-12 items-center relative z-10">
          <div class="md:col-span-7 space-y-6">
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 text-teal-400 text-xs font-bold border border-teal-500/20 uppercase tracking-widest">
              <Heart class="h-3 w-3 fill-teal-400" />
              Cooperadora Necochea
            </div>
            <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight leading-none text-slate-100">
              Cada aporte equipa un quirófano, cada socio salva una vida.
            </h1>
            <p class="text-base text-slate-300 max-w-xl font-light">
              Desde la Cooperadora del Hospital Municipal "Dr. Emilio Ferreyra" canalizamos la buena voluntad de la comunidad de Necochea y Quequén para dotar de insumos, aparatología y mejoras edilicias a nuestro querido hospital.
            </p>
            <div class="flex gap-4 pt-2">
              <button 
                onClick={handleHeroAssociate}
                class="bg-accent-red hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-lg shadow-red-950/20 transform active:scale-95 transition-all"
              >
                {token ? (user?.rol === 'admin' ? 'Ir al Panel Admin' : 'Ver Estado de Socio') : 'Quiero Asociarme Ahora'}
              </button>
            </div>
          </div>

          {/* Wireframe Hero Mini Card Illustration */}
          <div class="md:col-span-5 bg-slate-800/80 backdrop-blur border border-slate-700/50 p-8 rounded-3xl shadow-2xl relative">
            <h3 class="text-lg font-bold text-teal-400">Campaña Activa del Mes</h3>
            <p class="text-xs text-slate-300 mt-2 font-medium">Equipamiento del Sector Pediatría</p>
            <div class="my-6 p-4 rounded-xl bg-slate-900/50 border border-slate-700 space-y-3">
              <div class="flex justify-between text-xs text-slate-400 font-bold">
                <span>Progreso Colectivo</span>
                <span class="text-teal-400">82%</span>
              </div>
              <div class="w-full bg-slate-800 rounded-full h-3">
                <div class="bg-teal-400 h-full rounded-full w-[82%]"></div>
              </div>
              <div class="flex justify-between text-xs font-semibold pt-1">
                <span>Meta: $ 4.500.000</span>
                <span class="text-emerald-400">$ 3.690.000</span>
              </div>
            </div>
            <button 
              onClick={handleHeroDonate}
              class="w-full text-center py-3 bg-slate-700 hover:bg-slate-650 rounded-xl text-xs uppercase font-bold tracking-wider transition-all border border-slate-600/30"
            >
              {token ? 'Donar a Campaña Activa' : 'Donar con Tarjeta o QR'}
            </button>
          </div>
        </div>
      </section>

      {/* 2. STATS STRIP (Wireframe inspired) */}
      <section class="bg-white border-b border-slate-100 py-6 px-4">
        <div class="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div class="text-center">
            <div class="text-3xl font-extrabold text-slate-900">4</div>
            <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Etapas de Transparencia</div>
          </div>
          <div class="text-center border-l border-slate-100">
            <div class="text-3xl font-extrabold text-slate-900">100%</div>
            <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Cero Anónimos (Seguridad JWT)</div>
          </div>
          <div class="text-center border-l border-slate-100">
            <div class="text-3xl font-extrabold text-slate-900">Híbrido</div>
            <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">SQL + NoSQL Data Mashup</div>
          </div>
          <div class="text-center border-l border-slate-100">
            <div class="text-3xl font-extrabold text-slate-900">Necochea</div>
            <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Hospital Emilio Ferreyra</div>
          </div>
        </div>
      </section>

      {/* 3. CAMPAÑAS ECONÓMICAS */}
      <section id="campanas-section" class="max-w-7xl mx-auto py-16 px-4">
        <div class="flex items-baseline justify-between mb-8">
          <div>
            <h2 class="text-2xl font-black text-slate-800 tracking-tight">Campañas de Recaudación Activas</h2>
            <p class="text-sm text-slate-500 mt-1">Integridad relacional SQL vigilada bajo transacciones ACID.</p>
          </div>
          <span class="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full uppercase tracking-wider">SQL Engine</span>
        </div>

        {loadingCampaigns ? (
          <div class="text-center py-12 text-slate-400 font-medium">Cargando campañas...</div>
        ) : campaigns.length === 0 ? (
          <div class="text-center py-12 text-slate-400 font-medium bg-white rounded-2xl border border-dashed border-slate-200">
            No hay campañas de recaudación activas en este momento.
          </div>
        ) : (
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {campaigns.map((camp) => (
              <CampaignCard 
                key={camp.id} 
                campaign={camp} 
                onClickDetail={handleViewCampaignDetail} 
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. NOTICIAS Y NOVEDADES */}
      <section class="bg-slate-100 py-16 border-t border-slate-200/50">
        <div class="max-w-7xl mx-auto px-4">
          <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h2 class="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <Newspaper class="h-6 w-6 text-teal-600" />
                Noticias e Impacto Social
              </h2>
              <p class="text-sm text-slate-500 mt-1">Esquemas flexibles almacenados dinámicamente en MongoDB NoSQL.</p>
            </div>

            {/* Buscador de noticias */}
            <form onSubmit={handleSearch} class="flex items-center bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full md:max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar noticias o aparatología..."
                class="flex-grow px-4 py-2 text-sm focus:outline-none"
              />
              <button type="submit" class="bg-teal-600 hover:bg-teal-500 text-white p-2.5 transition-colors">
                <Search class="h-4 w-4" />
              </button>
            </form>
          </div>

          {loadingNews ? (
            <div class="text-center py-12 text-slate-400 font-medium">Cargando noticias...</div>
          ) : news.length === 0 ? (
            <div class="text-center py-12 text-slate-400 font-medium">
              No se encontraron noticias registradas.
            </div>
          ) : (
            <div class="grid md:grid-cols-2 gap-8">
              {news.map((noti) => (
                <div key={noti._id} class="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
                  <div class="flex items-center gap-2 text-xs font-bold text-teal-600 mb-2">
                    <span>{new Date(noti.fecha).toLocaleDateString('es-AR')}</span>
                    {noti.tags && noti.tags.map((tag, i) => (
                      <span key={i} class="bg-teal-50 text-teal-700 px-2 py-0.5 rounded text-[10px] uppercase font-semibold">#{tag}</span>
                    ))}
                  </div>
                  <h3 class="text-base font-bold text-slate-800 mb-3">{noti.titulo}</h3>
                  <div 
                    class="text-sm text-slate-600 font-light flex-grow leading-relaxed line-clamp-4"
                    dangerouslySetInnerHTML={{ __html: noti.cuerpo_html }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. DATA MASHUP DETAIL MODAL (Requires Logged-In user) */}
      {selectedCampaign && (
        <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-100 overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header Gradient */}
            <div class="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-5 text-white flex items-center justify-between">
              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider bg-white/20 text-slate-100 px-2.5 py-0.5 rounded">Data Mashup Activo (SQL + NoSQL)</span>
                <h3 class="text-lg font-bold mt-1 text-slate-100 leading-tight">{selectedCampaign.titulo}</h3>
              </div>
              <button 
                onClick={handleCloseModal}
                class="text-white hover:text-slate-200 font-bold bg-white/10 hover:bg-white/20 h-8 w-8 rounded-full flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div class="p-6 space-y-6 max-h-[50vh] overflow-y-auto">
              
              {/* Financial Progress Grid (SQL) */}
              <div class="bg-slate-50 border border-slate-100 p-4 rounded-2xl grid grid-cols-2 gap-4">
                <div>
                  <span class="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Meta Económica (SQL)</span>
                  <span class="text-lg font-black text-slate-800">$ {selectedCampaign.monto_objetivo.toLocaleString('es-AR')}</span>
                </div>
                <div>
                  <span class="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Recaudación Real (SQL)</span>
                  <span class="text-lg font-black text-emerald-600">$ {selectedCampaign.monto_actual.toLocaleString('es-AR')}</span>
                </div>
              </div>

              {/* Obra Status (NoSQL) */}
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado de Obra (NoSQL - MongoDB):</span>
                <span class="bg-teal-100 text-teal-800 text-xs font-bold px-2.5 py-1 rounded-full border border-teal-200/50">
                  {selectedCampaign.detalles.obra_status}
                </span>
              </div>

              {/* Multimedia Rich Gallery (NoSQL) */}
              {selectedCampaign.detalles.galeria_rica && (selectedCampaign.detalles.galeria_rica.imagenes?.length > 0 || selectedCampaign.detalles.galeria_rica.videos?.length > 0) && (
                <div class="space-y-2">
                  <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Galería Multimedia Enriquecida (NoSQL)</h4>
                  <div class="grid grid-cols-2 gap-3">
                    {selectedCampaign.detalles.galeria_rica.imagenes?.map((img, i) => (
                      <div key={i} class="bg-slate-100 rounded-xl h-24 flex items-center justify-center overflow-hidden border border-slate-200 text-xs text-slate-400">
                        {/* Placeholder image */}
                        <div class="text-center p-2">
                          <FileText class="h-6 w-6 mx-auto mb-1 text-slate-400" />
                          <span>Link: {img.slice(0, 20)}...</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Testimonies List (NoSQL) */}
              <div class="space-y-3">
                <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Narrativa y Testimonios (NoSQL)</h4>
                {selectedCampaign.detalles.testimonios?.length === 0 ? (
                  <p class="text-xs text-slate-400 italic">No se han registrado testimonios para esta campaña.</p>
                ) : (
                  <div class="space-y-3">
                    {selectedCampaign.detalles.testimonios?.map((testi, i) => (
                      <div key={i} class="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50 text-xs relative">
                        <p class="text-slate-600 italic">"{testi.texto}"</p>
                        <span class="block text-right font-bold text-slate-500 mt-1.5">— {testi.autor}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Donation Form and Footer */}
            <div class="bg-slate-50 p-6 border-t border-slate-100 space-y-4">
              {donationSuccess && (
                <div class="bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold p-3.5 rounded-xl">
                  {donationSuccess}
                </div>
              )}
              {donationError && (
                <div class="bg-red-100 border border-red-200 text-accent-red text-xs font-semibold p-3.5 rounded-xl">
                  {donationError}
                </div>
              )}

              <form onSubmit={handleDonate} class="flex flex-col sm:flex-row gap-3">
                <div class="relative flex-grow">
                  <span class="absolute left-3 top-2.5 text-slate-400 font-black text-sm">$</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    placeholder="Monto a donar (ARS)..."
                    class="w-full pl-7 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-semibold"
                    required
                    disabled={submittingDonation}
                  />
                </div>
                <div class="flex gap-2">
                  <button 
                    type="button"
                    onClick={handleCloseModal}
                    class="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors whitespace-nowrap"
                    disabled={submittingDonation}
                  >
                    Cerrar
                  </button>
                  <button 
                    type="submit"
                    class="px-5 py-2.5 bg-accent-red hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-colors whitespace-nowrap disabled:bg-slate-400"
                    disabled={submittingDonation}
                  >
                    {submittingDonation ? 'Procesando...' : 'Confirmar Donación'}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Home;
