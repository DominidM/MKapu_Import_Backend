import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(403).json({
      success: false,
      message: 'Token no proporcionado'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mkapu_secret_2025');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message:  'Token inválido o expirado'
    });
  }
};

export const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol_nombre)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso',
        required_roles: roles,
        your_role: req.user.rol_nombre
      });
    }
    next();
  };
};
