class AppError extends Error {
  public statusCode: number;
  public errorName: string;

  constructor(message: string, statusCode: number, errorName: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorName = errorName;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// Error 400: Para campos faltantes, tipos de datos incorrectos, etc.
class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

// Error 401: Para cuando el usuario no ha iniciado sesión o el token es inválido
class AuthenticationError extends AppError {
  constructor(message: string) {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

// Error 403: Para cuando el usuario sí está logueado, pero su ROL no le permite pasar
class AuthorizationError extends AppError {
  constructor(message: string) {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

// Error 409: Para conflictos de negocio, como cuando intentan comprar más de lo que hay en stock
class StockError extends AppError {
  constructor(message: string) {
    super(message, 409, 'STOCK_ERROR');
  }
}

export = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  StockError
};