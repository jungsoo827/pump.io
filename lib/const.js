"use strict";

var app = {
  SESSION_OBJECT_KEY: {
    USER: 'rimbol_user'
  },
  URL :{
    REGISTER: 'register',
    LOGIN: 'login',
  },
  HTTP_STATUS_CODE :{
    INTERNAL_ERROR: 500,
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    TOO_MANY_REQUESTS: 429,
    DUPLICATE: 451,
    REQUEST_TIMEOUT: 452,
    BAD_GATEWAY: 502
  }
};


module.exports = app;