import { verifyToken } from '../utils/auth.js';

export const protect = (req, res, next) => {
  let token;

  if (req.cookies.token) {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized to access this route' });
  }

  try {
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Not authorized to access this route' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Not authorized to access this route' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `User role ${req.user ? req.user.role : 'unknown'} is not authorized to access this route`
      });
    }
    next();
  };
};
