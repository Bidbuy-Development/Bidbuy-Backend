// src/middleware/auth.ts
import { decodeToken } from '../helpers/token.js';
import Vendor from '../models/vendor.js';
import Buyer from '../models/buyer.js';

// Authentication: find user or admin by decoded token ID
export const authenticate = async ( req, res, next ) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Authentication required. Please login.'
      });
    }

    // Extract token from Authorization header
    const token = authHeader.split(' ')[1];
    const decoded = decodeToken(token);
    const id = decoded.id;

    // search Vendor first
    let user = await Vendor.findById(id).select('-password');
    if (!user) {
      // Fallback to buyer
      user = await Buyer.findById(id).select('-password');
    }
    if (!user) {
      res.status(404).json({
        error: 'User not found.'
      });
    }

    // Attach found details to req
    req.user = user;

    // Proceed to next middleware
    next();
  } catch (err) {
    res.status(500).json({
        error: err.message
    })
  }
};

// Authorization: allow only specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    // check if the user was authenticated
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required.'
      });
    }

    // check the authenticated user for authorization access
    if (roles.length && !roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'You do not have permission to perform this action.'
      });
    }

    // If user is authenticated and authorized, proceed to next middleware
    next();
  };
};
