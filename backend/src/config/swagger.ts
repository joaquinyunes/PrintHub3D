import swaggerJsdoc from 'swagger-jsdoc';
import { appConfig } from './index';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PrintHub3D API',
      version: '1.0.0',
      description: 'API documentation for PrintHub3D SaaS',
    },
    servers: [
      { url: `${appConfig.apiPublicUrl}/api`, description: 'API' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/modules/**/*.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
