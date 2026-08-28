// Se ejecuta antes de cargar cualquier módulo del proyecto (setupFiles).
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.LOG_LEVEL = 'silent';
