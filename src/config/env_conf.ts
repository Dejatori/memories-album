/**
 * Configuración robusta de variables de entorno para cada entorno.
 * Se adapta según ENV_STATE (dev, test, prod) y carga variables con prefijos.
 */

import 'dotenv/config';

export type EnvState = 'dev' | 'test' | 'prod';

abstract class BaseEnvConfig {
  readonly ENV_STATE: EnvState;
  readonly PORT: number;
  readonly DATABASE_URL: string;
  readonly JWT_SECRET: string;
  readonly JWT_EXPIRES_IN: string;
  readonly CLOUDINARY_CLOUD_NAME: string;
  readonly CLOUDINARY_API_KEY: string;
  readonly CLOUDINARY_API_SECRET: string;
  readonly FRONTEND_URL: string;
  readonly VITE_API_BASE_URL: string;
  readonly LOG_LEVEL: string;

  protected constructor(
      envPrefix: string,
      envState: EnvState,
      defaultPort = 3001,
      defaultLogLevel = 'info'
  ) {
    this.ENV_STATE = envState;

    // Carga variables con prefijo específico del entorno
    this.PORT = Number(process.env[`${envPrefix}PORT`]) || defaultPort;
    this.DATABASE_URL = process.env[`${envPrefix}DATABASE_URL`] || '';
    this.JWT_SECRET = process.env[`${envPrefix}JWT_SECRET`] || '';
    this.JWT_EXPIRES_IN = process.env[`${envPrefix}JWT_EXPIRES_IN`] || '1d';
    this.CLOUDINARY_CLOUD_NAME = process.env[`${envPrefix}CLOUDINARY_CLOUD_NAME`] || '';
    this.CLOUDINARY_API_KEY = process.env[`${envPrefix}CLOUDINARY_API_KEY`] || '';
    this.CLOUDINARY_API_SECRET = process.env[`${envPrefix}CLOUDINARY_API_SECRET`] || '';
    this.FRONTEND_URL = process.env[`${envPrefix}FRONTEND_URL`] || 'http://localhost:5173';
    this.VITE_API_BASE_URL = process.env[`${envPrefix}VITE_API_BASE_URL`] || 'http://localhost:3001/api';
    this.LOG_LEVEL = process.env[`${envPrefix}LOG_LEVEL`] || defaultLogLevel;
  }
}

class DevEnvConfig extends BaseEnvConfig {
  constructor() {
    super('DEV_', 'dev', 3001, 'debug');
  }
}

class TestEnvConfig extends BaseEnvConfig {
  constructor() {
    super('TEST_', 'test', 3001, 'warn');
  }
}

class ProdEnvConfig extends BaseEnvConfig {
  constructor() {
    super('PROD_', 'prod', 3001, 'info');
  }
}

/**
 * Obtiene la configuración activa según ENV_STATE.
 */
export function getEnvConfig(): BaseEnvConfig {
  const envState = (process.env.ENV_STATE as EnvState) || 'dev';

  switch (envState) {
    case 'prod':
      return new ProdEnvConfig();
    case 'test':
      return new TestEnvConfig();
    default:
      return new DevEnvConfig();
  }
}

// Instancia singleton - opcional pero útil
export const config = getEnvConfig();