import {
  registerUserService,
  loginUserService,
  getSessionService,
  forgotPasswordService,
  resetPasswordService
} from '../services/authService.js';

const setTokenCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 8 * 60 * 60 * 1000 // 8 hours
  });
};

// Registro de nuevos usuarios
export const register = async (req, res, next) => {
  try {
    const { user, token, perfil } = await registerUserService(req.body);
    
    setTokenCookie(res, token);

    return res.status(201).json({
      message: 'Usuario registrado exitosamente.',
      user: {
        id: user.id,
        email: user.email,
        rol: user.rol,
        perfil: perfil ? {
          numero_asociado: perfil.numero_asociado,
          dni: perfil.dni,
          estado: perfil.estado,
          nombre: perfil.nombre,
          apellido: perfil.apellido,
          direccion: perfil.direccion,
          nacionalidad: perfil.nacionalidad,
          telefono: perfil.telefono,
          fecha_nacimiento: perfil.fecha_nacimiento,
          genero: perfil.genero,
          metodo_pago: perfil.metodo_pago,
          fecha_ultimo_pago: perfil.fecha_ultimo_pago,
          localidad: perfil.localidad,
          observaciones: perfil.observaciones
        } : null
      }
    });

  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Error en registro:', error);
    next(error);
  }
};

// Login de usuarios
export const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const { user, token } = await loginUserService(email, password);

    setTokenCookie(res, token);

    return res.json({
      message: 'Inicio de sesión exitoso.',
      user: {
        id: user.id,
        email: user.email,
        rol: user.rol,
        perfil: user.perfilSocio ? {
          numero_asociado: user.perfilSocio.numero_asociado,
          dni: user.perfilSocio.dni,
          estado: user.perfilSocio.estado,
          nombre: user.perfilSocio.nombre,
          apellido: user.perfilSocio.apellido,
          direccion: user.perfilSocio.direccion,
          nacionalidad: user.perfilSocio.nacionalidad,
          telefono: user.perfilSocio.telefono,
          fecha_nacimiento: user.perfilSocio.fecha_nacimiento,
          genero: user.perfilSocio.genero,
          metodo_pago: user.perfilSocio.metodo_pago,
          fecha_ultimo_pago: user.perfilSocio.fecha_ultimo_pago,
          localidad: user.perfilSocio.localidad,
          observaciones: user.perfilSocio.observaciones
        } : null
      }
    });

  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Error en login:', error);
    next(error);
  }
};

// Obtener sesión actual (Nuevo endpoint para cookies)
export const getMe = async (req, res, next) => {
  try {
    // req.user viene del middleware de autenticación (authMiddleware.js)
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado.' });
    }

    const user = await getSessionService(req.user.id);

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        rol: user.rol,
        perfil: user.perfilSocio ? {
          numero_asociado: user.perfilSocio.numero_asociado,
          dni: user.perfilSocio.dni,
          estado: user.perfilSocio.estado,
          nombre: user.perfilSocio.nombre,
          apellido: user.perfilSocio.apellido,
          direccion: user.perfilSocio.direccion,
          nacionalidad: user.perfilSocio.nacionalidad,
          telefono: user.perfilSocio.telefono,
          fecha_nacimiento: user.perfilSocio.fecha_nacimiento,
          genero: user.perfilSocio.genero,
          metodo_pago: user.perfilSocio.metodo_pago,
          fecha_ultimo_pago: user.perfilSocio.fecha_ultimo_pago,
          localidad: user.perfilSocio.localidad,
          observaciones: user.perfilSocio.observaciones
        } : null
      }
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Error al obtener sesión:', error);
    next(error);
  }
};

// Logout (Limpiar cookie)
export const logout = async (req, res, next) => {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('token', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax'
    });
    return res.json({ message: 'Sesión cerrada exitosamente.' });
  } catch (error) {
    next(error);
  }
};

// Solicitar recuperación de contraseña (Olvidé mi contraseña)
export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  const origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : null);

  try {
    await forgotPasswordService(email, origin);
    return res.json({
      message: 'Si el correo está registrado en nuestro sistema, te llegará un mensaje con instrucciones para restablecer tu contraseña.'
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Error en forgotPassword controller:', error);
    next(error);
  }
};

// Restablecer contraseña con token
export const resetPassword = async (req, res, next) => {
  const { token, password } = req.body;

  try {
    await resetPasswordService(token, password);
    return res.json({
      message: 'Tu contraseña ha sido restablecida correctamente.'
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Error en resetPassword controller:', error);
    next(error);
  }
};

