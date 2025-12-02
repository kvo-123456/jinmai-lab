// 声明.mjs模块的类型

declare module '../../server/jwt.mjs' {
  export function generateToken(payload: any, options?: any): string;
  export function verifyToken(token: string): any;
  export function decodeToken(token: string): any;
  export function getActiveJwtSecret(): string;
  export function getAllJwtSecrets(): string[];
  export function getJwtConfig(): any;
}

declare module '../../server/database.mjs' {
  export const userDB: any;
  export const favoriteDB: any;
  export const videoTaskDB: any;
  export const getDB: () => Promise<any>;
  export const getDBStatus: () => any;
  export const closeDB: () => Promise<void>;
  export const reconnectDB: () => Promise<any>;
}

declare module '../../server/api-error-handler.mjs' {
  export const API_ERRORS: any;
  export const ERROR_STATUS_CODES: any;
  export const ERROR_MESSAGES: any;
  export function sendErrorResponse(res: any, errorCode: string, options?: any): void;
  export function sendSuccessResponse(res: any, data?: any, options?: any): void;
  export function withErrorHandling(handler: Function): Function;
}
