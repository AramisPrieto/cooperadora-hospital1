import { body, validationResult } from 'express-validator';

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
 * Validaciones para POST /api/campanas/:id/donar
 */
export const validateDonation = [
  body('monto')
    .notEmpty().withMessage('El monto es obligatorio.')
    .isFloat({ gt: 0 }).withMessage('El monto debe ser un número mayor a 0.')
    .isFloat({ max: 10000000 }).withMessage('El monto no puede superar $10.000.000.')
    .toFloat(),

  handleValidationErrors,
];
