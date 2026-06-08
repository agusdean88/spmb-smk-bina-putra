const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_spmb_2026';
console.log('Middleware JWT_SECRET starts with:', JWT_SECRET.substring(0, 3) + '...');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log('Incoming Auth Header:', authHeader ? 'Found' : 'Not Found');
  
  if (!authHeader) {
    return res.status(403).json({ message: 'No token provided!' });
  }

  const token = authHeader.split(' ')[1];
  console.log('Token extracted:', token ? 'Yes (starts with ' + token.substring(0, 5) + '...)' : 'No');

  if (!token) {
    return res.status(403).json({ message: 'Invalid token format!' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('JWT_VERIFY_ERROR:', err.message);
      return res.status(401).json({ message: 'Unauthorized!' });
    }
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.userRole !== 'ADMIN') {
    return res.status(403).json({ message: 'Require Admin Role!' });
  }
  next();
};

const isStudent = (req, res, next) => {
  if (req.userRole !== 'STUDENT') {
    return res.status(403).json({ message: 'Require Student Role!' });
  }
  next();
};

module.exports = {
  verifyToken,
  isAdmin,
  isStudent
};
