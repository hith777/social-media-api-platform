import { Router, Request, Response } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { env } from '../config/env';

const router = Router();

// Swagger configuration
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Social Media API',
      version: '1.0.0',
      description: 'A comprehensive social media/community platform API',
      contact: {
        name: 'API Support',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Development server',
      },
      {
        url: 'https://api.example.com',
        description: 'Production server',
      },
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
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Users',
        description: 'User management, authentication, and profile operations',
      },
      {
        name: 'Content',
        description: 'Posts and comments management',
      },
      {
        name: 'Comments',
        description: 'Comment operations and replies',
      },
      {
        name: 'Social',
        description: 'Social interactions (likes, follows, blocks)',
      },
      {
        name: 'Notifications',
        description: 'User notifications management',
      },
      {
        name: 'Search',
        description: 'Search and discovery features',
      },
      {
        name: 'Batch',
        description: 'Batch request operations',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts', './src/routes/swagger-docs.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI
router.use('/swagger', swaggerUi.serve);
router.get('/swagger', swaggerUi.setup(swaggerSpec, { customCss: '.swagger-ui .topbar { display: none }' }));

// Swagger JSON
router.get('/swagger.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

export default router;

