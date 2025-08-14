import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()

// assign a new token for a user
// the token will be used to authenticate the user in subsequent requests
export const generateJwtToken = (userId, fullName, expiresIn) => {
    const token = jwt.sign(
        {
          id: userId,
          fullName,
        },
        process.env.JWT_SECRET,
        { expiresIn: expiresIn }
    );
    return token;
}

// decode/verify the token to get the user details
// this will be used to authenticate the user in subsequent requests
export const decodeToken = (token) => {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET)
    
      // if the token is valid, return the payload
      return payload;
    } catch (error) {
        // if the token is invalid, throw an error
      switch (error.name) {
        // if the token is invalid, throw an error
        case 'JsonWebTokenError':
          res.status(400).json({ error: 'Invalid token' });
        // if the token is expired, throw an error
        case 'TokenExpiredError':
          res.status(400).json({ error: 'User logged out... Please login to continue' });
        // if the token is not active yet, throw an error
        case 'NotBeforeError':
          res.status(400).json({ error: 'Token not active' });
        default:
            // if the token is not valid, throw an error
          res.status(400).json({ error: 'Authorization failed' });
      }
    }
  };