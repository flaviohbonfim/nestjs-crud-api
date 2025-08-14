import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/users/user.entity';
import { Product } from '../src/products/product.entity';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let userToken: string;
  let userId: string;
  let adminId: string;
  let productId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Apply global pipes and interceptors as in main.ts
    app.useGlobalPipes(
      new (require('@nestjs/common').ValidationPipe)({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalInterceptors(
      new (require('@nestjs/common').ClassSerializerInterceptor)(
        app.get(require('@nestjs/core').Reflector),
      ),
    );
    app.setGlobalPrefix('v1'); // Set global prefix as in main.ts
    await app.init();

    dataSource = app.get(DataSource);

    // Clear database before tests
    await dataSource.query('TRUNCATE TABLE products, users RESTART IDENTITY CASCADE;');

    // Register admin user
    const adminRegisterRes = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'adminpassword',
      })
      .expect(HttpStatus.CREATED);
    adminId = adminRegisterRes.body.id;

    // Login admin user
    const adminLoginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'adminpassword',
      })
      .expect(HttpStatus.OK);
    adminToken = adminLoginRes.body.access_token;

    // Register regular user
    const userRegisterRes = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'testpassword',
      })
      .expect(HttpStatus.CREATED);
    userId = userRegisterRes.body.id;

    // Login regular user
    const userLoginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'testpassword',
      })
      .expect(HttpStatus.OK);
    userToken = userLoginRes.body.access_token;

    // Manually set admin role for the admin user
    await dataSource
      .getRepository(User)
      .update({ id: adminId }, { role: 'admin' });
  });

  afterAll(async () => {
    await dataSource.query('TRUNCATE TABLE products, users RESTART IDENTITY CASCADE;');
    await app.close();
  });

  it('/ (GET) should return "Hello World!"', () => {
    return request(app.getHttpServer())
      .get('/v1/')
      .expect(HttpStatus.OK)
      .expect('Hello World!');
  });

  describe('Auth Flow', () => {
    it('should register a new user', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          name: 'Another User',
          email: 'another@example.com',
          password: 'anotherpassword',
        })
        .expect(HttpStatus.CREATED);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name', 'Another User');
      expect(res.body).toHaveProperty('email', 'another@example.com');
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('should prevent registration with existing email', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'testpassword',
        })
        .expect(HttpStatus.CONFLICT);
    });

    it('should login a user and return a token', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword',
        })
        .expect(HttpStatus.OK);
      expect(res.body).toHaveProperty('access_token');
    });

    it('should reject login with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Users Endpoint', () => {
    it('GET /users should be accessible by admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThanOrEqual(2); // Admin and Test User
      expect(res.body[0]).not.toHaveProperty('passwordHash');
    });

    it('GET /users should be forbidden for regular user', () => {
      return request(app.getHttpServer())
        .get('/v1/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('GET /users should be unauthorized without token', () => {
      return request(app.getHttpServer())
        .get('/v1/users')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Products CRUD', () => {
    it('POST /products should create a product for the authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'My First Product',
          description: 'A great product',
          price: 99.99,
          stock: 50,
        })
        .expect(HttpStatus.CREATED);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name', 'My First Product');
      expect(res.body).toHaveProperty('ownerId', userId);
      productId = res.body.id; // Save for later tests
    });

    it('GET /products should return products', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/products')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('ownerId', userId);
    });

    it('GET /products/:id should return a specific product', async () => {
      const res = await request(app.getHttpServer())
        .get(`/v1/products/${productId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);
      expect(res.body).toHaveProperty('id', productId);
      expect(res.body).toHaveProperty('name', 'My First Product');
    });

    it('PATCH /products/:id should update product if owner', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/v1/products/${productId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Updated Product Name' })
        .expect(HttpStatus.OK);
      expect(res.body).toHaveProperty('name', 'Updated Product Name');
    });

    it('PATCH /products/:id should update product if admin', async () => {
      const newProductRes = await request(app.getHttpServer())
        .post('/v1/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Product for Admin Test', price: 10, stock: 10 })
        .expect(HttpStatus.CREATED);
      const productForAdminId = newProductRes.body.id;

      const res = await request(app.getHttpServer())
        .patch(`/v1/products/${productForAdminId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 20 })
        .expect(HttpStatus.OK);
      expect(res.body).toHaveProperty('price', 20);
    });

    it('PATCH /products/:id should be forbidden if not owner or admin', () => {
      return request(app.getHttpServer())
        .patch(`/v1/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Forbidden Update' })
        .expect(HttpStatus.FORBIDDEN);
    });

    it('DELETE /products/:id should delete product if owner', () => {
      return request(app.getHttpServer())
        .delete(`/v1/products/${productId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.NO_CONTENT);
    });

    it('DELETE /products/:id should delete product if admin', async () => {
      const newProductRes = await request(app.getHttpServer())
        .post('/v1/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Product to Delete by Admin', price: 1, stock: 1 })
        .expect(HttpStatus.CREATED);
      const productToDeleteId = newProductRes.body.id;

      return request(app.getHttpServer())
        .delete(`/v1/products/${productToDeleteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.NO_CONTENT);
    });

    it('DELETE /products/:id should be forbidden if not owner or admin', async () => {
      const newProductRes = await request(app.getHttpServer())
        .post('/v1/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Product for Forbidden Delete', price: 1, stock: 1 })
        .expect(HttpStatus.CREATED);
      const productForForbiddenDeleteId = newProductRes.body.id;

      return request(app.getHttpServer())
        .delete(`/v1/products/${productForForbiddenDeleteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });
});