import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, Shield, Scale, Info, CheckCircle2 } from 'lucide-react';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Enlace de regreso */}
        <div className="text-left">
          <Link
            to="/"
            className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Volver al Inicio
          </Link>
        </div>

        {/* Encabezado */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-8 sm:p-10 space-y-4 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-brand-50 rounded-2xl text-brand-600 mb-2">
            <Scale className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-display font-black text-slate-800 tracking-tight">
            Términos y Condiciones de Uso
          </h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Última actualización: 21 de Junio de 2026
          </p>
          <div className="h-0.5 w-16 bg-brand-500 mx-auto rounded-full mt-4" />
        </div>

        {/* Secciones de Contenido */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-8 sm:p-10 space-y-8 text-left">
          
          <section className="space-y-3">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-brand-500 rounded-full" />
              1. Aceptación de los Términos
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Al acceder y utilizar el portal web de la Asociación Cooperadora del Hospital Municipal "Dr. Emilio Ferreyra", usted acepta de manera incondicional estar sujeto a los presentes Términos y Condiciones. Si no está de acuerdo con alguna sección, le solicitamos que no continúe utilizando el sitio ni declare transacciones en el mismo.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-brand-500 rounded-full" />
              2. Registro de Socios y Cuotas Sociales
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              El registro como socio a través del sitio web inicia una solicitud de ingreso sujeta a la aprobación de la Comisión Directiva de la Cooperadora de acuerdo con sus estatutos. 
            </p>
            <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1.5 font-medium">
              <li><strong>Cuota Social:</strong> El valor de la cuota mensual es voluntario (con un monto mínimo sugerido para cubrir gastos administrativos).</li>
              <li><strong>Suscripción Recurrente:</strong> Si el usuario opta por la suscripción mensual a través de Mercado Pago, autoriza el cobro automático recurrente del monto seleccionado.</li>
              <li><strong>Baja de Suscripción:</strong> La baja de la cuota recurrente puede ser gestionada por el socio en cualquier momento ingresando a su panel personal o contactando directamente a la Cooperadora vía correo electrónico.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-brand-500 rounded-full" />
              3. Donaciones y Declaración de Transferencias
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Las donaciones destinadas a las campañas activas son aportes voluntarios no reembolsables. Al declarar una transferencia bancaria manual, el usuario se compromete a adjuntar información verídica y un número de comprobante válido. La Cooperadora se reserva el derecho de auditar y rechazar declaraciones falsas o erróneas.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-brand-500 rounded-full" />
              4. Tratamiento de Datos Personales (Ley 25.326)
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              En cumplimiento con la Ley de Protección de Datos Personales Nº 25.326 de la República Argentina, la Cooperadora asegura la confidencialidad de la información brindada por los usuarios (DNI, nombres, dirección, teléfono, correo electrónico). Los datos recopilados serán de uso exclusivo administrativo interno y no serán cedidos a terceros bajo ningún concepto sin previo consentimiento.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-brand-500 rounded-full" />
              5. Limitación de Responsabilidad
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              La Cooperadora no se responsabiliza por fallas técnicas en las pasarelas de pago externas (como Mercado Pago), ni por el uso indebido de las cuentas o contraseñas de los usuarios en la plataforma. Es responsabilidad del usuario resguardar sus credenciales de acceso de forma segura.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-brand-500 rounded-full" />
              6. Modificaciones de los Términos
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              La Asociación Cooperadora se reserva el derecho de modificar los presentes Términos y Condiciones en cualquier momento con el fin de adaptarlos a nuevas normativas legales o decisiones internas. Los cambios serán publicados de inmediato en este sitio web.
            </p>
          </section>

          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-bold">
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-emerald-500" />
              Datos Protegidos con encriptación SSL
            </span>
            <span>Asociación Cooperadora del Hospital Municipal Necochea</span>
          </div>

        </div>

      </div>
    </div>
  );
};

export default TermsAndConditions;
