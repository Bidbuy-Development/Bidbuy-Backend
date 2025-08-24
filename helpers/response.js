// src/utils/response.js
export const successResponse = ( message = 'success', payload = {}) => {
  return {
    success: true,
    message,
    data: payload || {}
  };
};

export const errorResponse = (message = 'error', payload = {}) => {
  return {
    success: false,
    message,
    data: payload || {}
  };
};
