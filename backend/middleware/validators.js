import { body, param, validationResult } from 'express-validator';

/**
 * Middleware que verifica el resultado de las validaciones.
 * Si hay errores, responde 400 con el primer mensaje de error.
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

/**
 * Validador para IDs enteros en parámetros de ruta (:id)
 */
export const validateSqlId = (paramName = 'id') => [
  param(paramName)
    .isInt({ min: 1 }).withMessage(`El parámetro ${paramName} debe ser un número entero válido mayor a 0.`)
    .toInt(),
  handleValidationErrors
];

/**
 * Validador para IDs ObjectId de MongoDB en parámetros de ruta (:id)
 */
export const validateMongoId = (paramName = 'id') => [
  param(paramName)
    .matches(/^[0-9a-fA-F]{24}$/).withMessage(`El identificador ${paramName} debe ser un ObjectId válido de 24 caracteres hexadecimales.`),
  handleValidationErrors
];

/**
 * Validador personalizado para prevenir la inyección de URLs/enlaces y etiquetas HTML/scripts
 */
const cleanTextInput = (value) => {
  if (typeof value === 'string') {
    // Detectar URLs (http://, https://, www.)
    if (/https?:\/\/|www\./i.test(value)) {
      throw new Error('No se permiten enlaces o URLs en este campo.');
    }
    // Detectar etiquetas HTML o scripts
    if (/<[^>]*>/g.test(value)) {
      throw new Error('No se permiten etiquetas HTML o scripts en este campo.');
    }
  }
  return true;
};

/**
 * Validador personalizado para campos que esperan URLs, permitiendo enlaces pero bloqueando etiquetas HTML/scripts
 */
const cleanUrlInput = (value) => {
  if (typeof value === 'string') {
    // Detectar etiquetas HTML o scripts
    if (/<[^>]*>/g.test(value)) {
      throw new Error('No se permiten etiquetas HTML o scripts en este campo.');
    }
  }
  return true;
};

/**
 * Validaciones para POST /api/auth/register
 */
export const validateRegister = [
  body('email')
    .notEmpty().withMessage('El email es obligatorio.')
    .isEmail().withMessage('El formato del email no es válido.')
    .isLength({ max: 255 }).withMessage('El email no puede superar los 255 caracteres.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria.')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.')
    .isLength({ max: 128 }).withMessage('La contraseña no puede superar los 128 caracteres.'),

  body('dni')
    .notEmpty().withMessage('El DNI es obligatorio.')
    .isInt({ min: 1000000, max: 99999999 }).withMessage('El DNI debe ser un número válido entre 1.000.000 y 99.999.999.')
    .toInt(),

  body('nombre')
    .notEmpty().withMessage('El nombre es obligatorio.')
    .isLength({ min: 1, max: 100 }).withMessage('El nombre debe tener entre 1 y 100 caracteres.')
    .custom(cleanTextInput),

  body('apellido')
    .notEmpty().withMessage('El apellido es obligatorio.')
    .isLength({ min: 1, max: 100 }).withMessage('El apellido debe tener entre 1 y 100 caracteres.')
    .custom(cleanTextInput),

  body('direccion')
    .notEmpty().withMessage('La dirección es obligatoria.')
    .isLength({ min: 1, max: 255 }).withMessage('La dirección debe tener entre 1 y 255 caracteres.')
    .custom(cleanTextInput),

  body('localidad')
    .notEmpty().withMessage('La localidad es obligatoria.')
    .isLength({ min: 1, max: 100 }).withMessage('La localidad debe tener entre 1 y 100 caracteres.')
    .custom(cleanTextInput),

  body('nacionalidad')
    .notEmpty().withMessage('La nacionalidad es obligatoria.')
    .isLength({ min: 1, max: 100 }).withMessage('La nacionalidad debe tener entre 1 y 100 caracteres.')
    .custom(cleanTextInput),

  body('telefono')
    .notEmpty().withMessage('El teléfono es obligatorio.')
    .isLength({ min: 1, max: 50 }).withMessage('El teléfono debe tener entre 1 y 50 caracteres.')
    .custom(cleanTextInput),

  body('fecha_nacimiento')
    .notEmpty().withMessage('La fecha de nacimiento es obligatoria.')
    .isISO8601().withMessage('La fecha de nacimiento debe ser una fecha válida (AAAA-MM-DD).')
    .custom((val) => {
      if (new Date(val) >= new Date()) {
        throw new Error('La fecha de nacimiento debe ser una fecha en el pasado.');
      }
      return true;
    }),

  body('genero')
    .notEmpty().withMessage('El género es obligatorio.')
    .isIn(['masculino', 'femenino', 'otro']).withMessage('El género debe ser: masculino, femenino u otro.'),

  body('metodo_pago')
    .notEmpty().withMessage('El método de pago es obligatorio.')
    .isIn(['transferencia', 'efectivo', 'cobrador', 'debito']).withMessage('El método de pago debe ser: transferencia, efectivo, cobrador o debito.'),

  // Prohibir inyección de campos administrativos
  body('rol').not().exists().withMessage('No está permitido asignar rol en el registro.'),
  body('estado').not().exists().withMessage('No está permitido asignar estado en el registro.'),
  body('observaciones').not().exists().withMessage('No está permitido enviar observaciones en el registro.'),
  body('fecha_ultimo_pago').not().exists().withMessage('No está permitido enviar fecha de último pago en el registro.'),

  handleValidationErrors,
];

/**
 * Validaciones para POST /api/auth/login
 */
export const validateLogin = [
  body('email')
    .notEmpty().withMessage('El email es obligatorio.')
    .isEmail().withMessage('El formato del email no es válido.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria.'),

  handleValidationErrors,
];

/**
 * Validaciones para POST /api/campanas/:id/donar y donar-transferencia
 */
export const validateDonation = [
  body('monto')
    .notEmpty().withMessage('El monto es obligatorio.')
    .isFloat({ min: 1000 }).withMessage('El monto mínimo para donar es $1.000.')
    .isFloat({ max: 10000000 }).withMessage('El monto no puede superar $10.000.000.')
    .toFloat(),

  body('numero_comprobante')
    .optional({ checkFalsy: true })
    .isLength({ max: 100 }).withMessage('El número de comprobante no puede superar los 100 caracteres.')
    .custom(cleanTextInput),

  body('comprobante_url')
    .optional({ checkFalsy: true })
    .isLength({ max: 500 }).withMessage('La URL del comprobante no puede superar los 500 caracteres.')
    .custom(cleanUrlInput),

  handleValidationErrors,
];

/**
 * Validaciones para declarar el pago de una cuota por transferencia
 */
export const validateDeclararPago = [
  body('monto')
    .notEmpty().withMessage('El monto es obligatorio.')
    .isFloat({ min: 2000 }).withMessage('El monto mínimo de la suscripción/cuota es de $2.000.')
    .isFloat({ max: 10000000 }).withMessage('El monto no puede superar $10.000.000.')
    .toFloat(),

  body('numero_comprobante')
    .optional({ checkFalsy: true })
    .isLength({ max: 100 }).withMessage('El número de comprobante no puede superar los 100 caracteres.')
    .custom(cleanTextInput),

  body('comprobante_url')
    .optional({ checkFalsy: true })
    .isLength({ max: 500 }).withMessage('La URL del comprobante no puede superar los 500 caracteres.')
    .custom(cleanUrlInput),

  handleValidationErrors,
];

/**
 * Validaciones para autogestión de perfil de socio (PUT /api/socios/mi-perfil)
 * Solo permite modificar los campos de contacto y perfil personal permitidos.
 * Bloquea la inyección de campos administrativos (estado, cuotas, observaciones).
 */
export const validateUpdateMyProfile = [
  body('estado').not().exists().withMessage('Los socios no pueden modificar su estado de registro.'),
  body('fecha_ultimo_pago').not().exists().withMessage('Los socios no pueden modificar la fecha de último pago.'),
  body('observaciones').not().exists().withMessage('Los socios no pueden editar las observaciones administrativas.'),
  body('numero_asociado').not().exists().withMessage('No se permite modificar el número de asociado.'),
  body('usuario_id_fk').not().exists().withMessage('No se permite alterar la vinculación de usuario.'),

  body('dni')
    .optional()
    .isInt({ min: 1000000, max: 99999999 }).withMessage('El DNI debe ser un número válido entre 1.000.000 y 99.999.999.')
    .toInt(),

  body('nombre')
    .optional()
    .isLength({ min: 1, max: 100 }).withMessage('El nombre debe tener entre 1 y 100 caracteres.')
    .custom(cleanTextInput),

  body('apellido')
    .optional()
    .isLength({ min: 1, max: 100 }).withMessage('El apellido debe tener entre 1 y 100 caracteres.')
    .custom(cleanTextInput),

  body('direccion')
    .optional()
    .isLength({ min: 1, max: 255 }).withMessage('La dirección debe tener entre 1 y 255 caracteres.')
    .custom(cleanTextInput),

  body('localidad')
    .optional()
    .isLength({ min: 1, max: 100 }).withMessage('La localidad debe tener entre 1 y 100 caracteres.')
    .custom(cleanTextInput),

  body('nacionalidad')
    .optional()
    .isLength({ min: 1, max: 100 }).withMessage('La nacionalidad debe tener entre 1 y 100 caracteres.')
    .custom(cleanTextInput),

  body('telefono')
    .optional()
    .isLength({ min: 1, max: 50 }).withMessage('El teléfono debe tener entre 1 y 50 caracteres.')
    .custom(cleanTextInput),

  body('fecha_nacimiento')
    .optional()
    .isISO8601().withMessage('La fecha de nacimiento debe ser una fecha válida (AAAA-MM-DD).')
    .custom((val) => {
      if (new Date(val) >= new Date()) {
        throw new Error('La fecha de nacimiento debe ser en el pasado.');
      }
      return true;
    }),

  body('genero')
    .optional()
    .isIn(['masculino', 'femenino', 'otro']).withMessage('El género debe ser: masculino, femenino u otro.'),

  body('metodo_pago')
    .optional()
    .isIn(['transferencia', 'efectivo', 'cobrador', 'debito']).withMessage('El método de pago debe ser: transferencia, efectivo, cobrador o debito.'),

  handleValidationErrors,
];

/**
 * Validaciones para creación manual de socio por Administrador (POST /api/socios)
 */
export const validateAdminCreateSocio = [
  body('usuario_id_fk')
    .notEmpty().withMessage('El identificador de usuario relacional (usuario_id_fk) es obligatorio.')
    .isInt({ min: 1 }).withMessage('usuario_id_fk debe ser un número entero válido.')
    .toInt(),

  body('dni')
    .notEmpty().withMessage('El DNI es obligatorio.')
    .isInt({ min: 1000000, max: 99999999 }).withMessage('El DNI debe ser un número válido entre 1.000.000 y 99.999.999.')
    .toInt(),

  body('nombre')
    .notEmpty().withMessage('El nombre es obligatorio.')
    .isLength({ min: 1, max: 100 }).withMessage('El nombre debe tener entre 1 y 100 caracteres.')
    .custom(cleanTextInput),

  body('apellido')
    .notEmpty().withMessage('El apellido es obligatorio.')
    .isLength({ min: 1, max: 100 }).withMessage('El apellido debe tener entre 1 y 100 caracteres.')
    .custom(cleanTextInput),

  body('direccion')
    .notEmpty().withMessage('La dirección es obligatoria.')
    .isLength({ min: 1, max: 255 }).withMessage('La dirección debe tener entre 1 y 255 caracteres.')
    .custom(cleanTextInput),

  body('localidad')
    .notEmpty().withMessage('La localidad es obligatoria.')
    .isLength({ min: 1, max: 100 }).withMessage('La localidad debe tener entre 1 y 100 caracteres.')
    .custom(cleanTextInput),

  body('nacionalidad')
    .notEmpty().withMessage('La nacionalidad es obligatoria.')
    .isLength({ min: 1, max: 100 }).withMessage('La nacionalidad debe tener entre 1 y 100 caracteres.')
    .custom(cleanTextInput),

  body('telefono')
    .notEmpty().withMessage('El teléfono es obligatorio.')
    .isLength({ min: 1, max: 50 }).withMessage('El teléfono debe tener entre 1 y 50 caracteres.')
    .custom(cleanTextInput),

  body('fecha_nacimiento')
    .notEmpty().withMessage('La fecha de nacimiento es obligatoria.')
    .isISO8601().withMessage('La fecha de nacimiento debe ser una fecha válida (AAAA-MM-DD).')
    .custom((val) => {
      if (new Date(val) >= new Date()) throw new Error('La fecha de nacimiento debe ser en el pasado.');
      return true;
    }),

  body('genero')
    .notEmpty().withMessage('El género es obligatorio.')
    .isIn(['masculino', 'femenino', 'otro']).withMessage('El género debe ser: masculino, femenino u otro.'),

  body('metodo_pago')
    .notEmpty().withMessage('El método de pago es obligatorio.')
    .isIn(['transferencia', 'efectivo', 'cobrador', 'debito']).withMessage('El método de pago debe ser: transferencia, efectivo, cobrador o debito.'),

  body('estado')
    .optional()
    .isIn(['pendiente', 'activo', 'inactivo']).withMessage('El estado debe ser: pendiente, activo o inactivo.'),

  body('fecha_ultimo_pago')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage('La fecha de último pago debe ser una fecha válida.'),

  body('observaciones')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 1000 }).withMessage('Las observaciones no pueden superar los 1000 caracteres.')
    .custom(cleanTextInput),

  handleValidationErrors,
];

/**
 * Validaciones para edición de socio por Administrador (PUT /api/socios/:id)
 */
export const validateAdminUpdateSocio = [
  body('dni')
    .optional()
    .isInt({ min: 1000000, max: 99999999 }).withMessage('El DNI debe ser un número válido entre 1.000.000 y 99.999.999.')
    .toInt(),

  body('nombre')
    .optional()
    .isLength({ min: 1, max: 100 }).withMessage('El nombre debe tener entre 1 y 100 caracteres.')
    .custom(cleanTextInput),

  body('apellido')
    .optional()
    .isLength({ min: 1, max: 100 }).withMessage('El apellido debe tener entre 1 y 100 caracteres.')
    .custom(cleanTextInput),

  body('direccion')
    .optional()
    .isLength({ min: 1, max: 255 }).withMessage('La dirección debe tener entre 1 y 255 caracteres.')
    .custom(cleanTextInput),

  body('localidad')
    .optional()
    .isLength({ min: 1, max: 100 }).withMessage('La localidad debe tener entre 1 y 100 caracteres.')
    .custom(cleanTextInput),

  body('nacionalidad')
    .optional()
    .isLength({ min: 1, max: 100 }).withMessage('La nacionalidad debe tener entre 1 y 100 caracteres.')
    .custom(cleanTextInput),

  body('telefono')
    .optional()
    .isLength({ min: 1, max: 50 }).withMessage('El teléfono debe tener entre 1 y 50 caracteres.')
    .custom(cleanTextInput),

  body('fecha_nacimiento')
    .optional()
    .isISO8601().withMessage('La fecha de nacimiento debe ser una fecha válida (AAAA-MM-DD).')
    .custom((val) => {
      if (new Date(val) >= new Date()) throw new Error('La fecha de nacimiento debe ser en el pasado.');
      return true;
    }),

  body('genero')
    .optional()
    .isIn(['masculino', 'femenino', 'otro']).withMessage('El género debe ser: masculino, femenino u otro.'),

  body('metodo_pago')
    .optional()
    .isIn(['transferencia', 'efectivo', 'cobrador', 'debito']).withMessage('El método de pago debe ser: transferencia, efectivo, cobrador o debito.'),

  body('estado')
    .optional()
    .isIn(['pendiente', 'activo', 'inactivo']).withMessage('El estado debe ser: pendiente, activo o inactivo.'),

  body('fecha_ultimo_pago')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage('La fecha de último pago debe ser una fecha válida.'),

  body('observaciones')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 1000 }).withMessage('Las observaciones no pueden superar los 1000 caracteres.')
    .custom(cleanTextInput),

  handleValidationErrors,
];

// Compatibilidad hacia atrás si algún script aún importa validateSocio
export const validateSocio = validateAdminUpdateSocio;

/**
 * Validaciones para creación de campañas por Admin (POST /api/campanas)
 */
export const validateCampana = [
  body('titulo')
    .notEmpty().withMessage('El título de la campaña es obligatorio.')
    .isString().withMessage('El título debe ser texto.')
    .isLength({ min: 1, max: 255 }).withMessage('El título debe tener entre 1 y 255 caracteres.')
    .custom(cleanTextInput),

  body('monto_objetivo')
    .notEmpty().withMessage('El monto objetivo es obligatorio.')
    .isFloat({ min: 1, max: 1000000000 }).withMessage('El monto objetivo debe ser mayor a 0 y no superar $1.000.000.000.')
    .toFloat(),

  body('monto_actual')
    .optional()
    .isFloat({ min: 0, max: 1000000000 }).withMessage('El monto actual debe ser un número positivo.')
    .toFloat(),

  body('fecha_limite')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage('La fecha límite debe ser una fecha válida (AAAA-MM-DD).'),

  body('obra_status')
    .optional()
    .isIn(['Planeada', 'En Ejecución', 'En Proceso de Licitación', 'Finalizada', 'Suspendida'])
    .withMessage('El estado de obra seleccionado no es válido.'),

  body('es_campana_del_mes')
    .optional()
    .isBoolean().withMessage('es_campana_del_mes debe ser un valor booleano.')
    .toBoolean(),

  body('equipamiento_info')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 2000 }).withMessage('La información de equipamiento no puede superar los 2000 caracteres.')
    .custom(cleanTextInput),

  body('equipamiento_imagen')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 500 }).withMessage('La URL de la imagen del equipo no puede superar 500 caracteres.')
    .custom(cleanUrlInput),

  body('testimonios')
    .optional()
    .isArray().withMessage('Los testimonios deben ser una lista.'),

  body('galeria_rica')
    .optional()
    .isObject().withMessage('La galería rica debe ser un objeto.'),

  handleValidationErrors,
];

/**
 * Validaciones para actualización de campañas por Admin (PUT /api/campanas/:id)
 */
export const validateCampanaUpdate = [
  body('titulo')
    .optional()
    .isString().withMessage('El título debe ser texto.')
    .isLength({ min: 1, max: 255 }).withMessage('El título debe tener entre 1 y 255 caracteres.')
    .custom(cleanTextInput),

  body('monto_objetivo')
    .optional()
    .isFloat({ min: 1, max: 1000000000 }).withMessage('El monto objetivo debe ser mayor a 0 y no superar $1.000.000.000.')
    .toFloat(),

  body('monto_actual')
    .optional()
    .isFloat({ min: 0, max: 1000000000 }).withMessage('El monto actual debe ser un número positivo.')
    .toFloat(),

  body('fecha_limite')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage('La fecha límite debe ser una fecha válida (AAAA-MM-DD).'),

  body('activo')
    .optional()
    .isBoolean().withMessage('activo debe ser un valor booleano.')
    .toBoolean(),

  body('obra_status')
    .optional()
    .isIn(['Planeada', 'En Ejecución', 'En Proceso de Licitación', 'Finalizada', 'Suspendida'])
    .withMessage('El estado de obra seleccionado no es válido.'),

  body('es_campana_del_mes')
    .optional()
    .isBoolean().withMessage('es_campana_del_mes debe ser un valor booleano.')
    .toBoolean(),

  body('equipamiento_info')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 2000 }).withMessage('La información de equipamiento no puede superar los 2000 caracteres.')
    .custom(cleanTextInput),

  body('equipamiento_imagen')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 500 }).withMessage('La URL de la imagen del equipo no puede superar 500 caracteres.')
    .custom(cleanUrlInput),

  body('testimonios')
    .optional()
    .isArray().withMessage('Los testimonios deben ser una lista.'),

  body('galeria_rica')
    .optional()
    .isObject().withMessage('La galería rica debe ser un objeto.'),

  handleValidationErrors,
];

/**
 * Validaciones para creación de noticias por Admin (POST /api/noticias)
 */
export const validateNoticia = [
  body('titulo')
    .notEmpty().withMessage('El título de la noticia es obligatorio.')
    .isString().withMessage('El título debe ser texto.')
    .isLength({ min: 1, max: 255 }).withMessage('El título debe tener entre 1 y 255 caracteres.')
    .custom(cleanTextInput),

  body('cuerpo_html')
    .notEmpty().withMessage('El contenido de la noticia es obligatorio.')
    .isString().withMessage('El contenido debe ser texto.')
    .isLength({ min: 1, max: 50000 }).withMessage('El contenido de la noticia no puede superar los 50.000 caracteres.'),

  body('fecha')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage('La fecha debe tener un formato de fecha válido.'),

  body('imagen_url')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 500 }).withMessage('La URL de la imagen no puede superar 500 caracteres.')
    .custom(cleanUrlInput),

  body('tags')
    .optional()
    .isArray().withMessage('Los tags deben ser una lista.'),

  handleValidationErrors,
];

/**
 * Validaciones para actualización de noticias por Admin (PUT /api/noticias/:id)
 */
export const validateNoticiaUpdate = [
  body('titulo')
    .optional()
    .isString().withMessage('El título debe ser texto.')
    .isLength({ min: 1, max: 255 }).withMessage('El título debe tener entre 1 y 255 caracteres.')
    .custom(cleanTextInput),

  body('cuerpo_html')
    .optional()
    .isString().withMessage('El contenido debe ser texto.')
    .isLength({ min: 1, max: 50000 }).withMessage('El contenido de la noticia no puede superar los 50.000 caracteres.'),

  body('fecha')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage('La fecha debe tener un formato de fecha válido.'),

  body('imagen_url')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 500 }).withMessage('La URL de la imagen no puede superar 500 caracteres.')
    .custom(cleanUrlInput),

  body('tags')
    .optional()
    .isArray().withMessage('Los tags deben ser una lista.'),

  handleValidationErrors,
];

/**
 * Validaciones para POST /api/auth/forgot-password
 */
export const validateForgotPassword = [
  body('email')
    .notEmpty().withMessage('El email es obligatorio.')
    .isEmail().withMessage('El formato del email no es válido.')
    .normalizeEmail(),

  handleValidationErrors,
];

/**
 * Validaciones para POST /api/auth/reset-password
 */
export const validateResetPassword = [
  body('token')
    .notEmpty().withMessage('El token de recuperación es obligatorio.')
    .isString().withMessage('El token no es válido.'),

  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria.')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.')
    .isLength({ max: 128 }).withMessage('La contraseña no puede superar los 128 caracteres.'),

  handleValidationErrors,
];

