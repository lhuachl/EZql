// === EJEMPLOS COMPLETOS DE USO DEL FRAMEWORK EZQL ===
// Ejemplos prácticos para diferentes casos de uso

import 'reflect-metadata';
import { 
  createEZqlApp, Controller, Get, Post, Put, Delete,
  Body, Param, Query, Injectable, ApiOperation, UseMiddleware
} from '../scr/web';

// ============================================================================
// EJEMPLO 1: API BÁSICA SIN BASE DE DATOS
// ============================================================================

// DTO con validación robusta
class ProductDto {
  name!: string;
  price!: number;
  category!: string;
  description?: string;

  async validate() {
    const errors = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Product name is required', code: 'REQUIRED' });
    }

    if (this.name && this.name.length > 100) {
      errors.push({ field: 'name', message: 'Name must be 100 characters or less', code: 'MAX_LENGTH' });
    }

    if (!this.price || this.price <= 0) {
      errors.push({ field: 'price', message: 'Price must be greater than 0', code: 'INVALID_VALUE' });
    }

    if (!this.category || !['electronics', 'clothing', 'books', 'home'].includes(this.category)) {
      errors.push({ 
        field: 'category', 
        message: 'Category must be one of: electronics, clothing, books, home', 
        code: 'INVALID_OPTION' 
      });
    }

    return { isValid: errors.length === 0, errors };
  }
}

// Servicio con lógica de negocio
@Injectable()
class ProductService {
  private products: Array<{ id: number; name: string; price: number; category: string; description?: string; createdAt?: Date }> = [
    { id: 1, name: 'Laptop', price: 999.99, category: 'electronics', description: 'High-performance laptop' },
    { id: 2, name: 'T-Shirt', price: 29.99, category: 'clothing', description: 'Cotton t-shirt' }
  ];

  findAll(category?: string, minPrice?: number, maxPrice?: number) {
    let filtered = [...this.products];

    if (category) {
      filtered = filtered.filter(p => p.category === category);
    }

    if (minPrice !== undefined) {
      filtered = filtered.filter(p => p.price >= minPrice);
    }

    if (maxPrice !== undefined) {
      filtered = filtered.filter(p => p.price <= maxPrice);
    }

    return {
      success: true,
      data: filtered,
      count: filtered.length,
      filters: { category, minPrice, maxPrice }
    };
  }

  async create(productData: ProductDto) {
    const dto = Object.assign(new ProductDto(), productData);
    const validation = await dto.validate();
    
    if (!validation.isValid) {
      return { success: false, message: 'Validation failed', errors: validation.errors };
    }

    const product = {
      id: Math.max(...this.products.map(p => p.id), 0) + 1,
      ...dto,
      createdAt: new Date()
    };

    this.products.push(product);
    return { success: true, data: product, message: 'Product created successfully' };
  }
}

// Controlador con decoradores
@Controller('/api/products')
@Injectable()
class ProductController {
  constructor(private productService: ProductService) {}

  @Get('/')
  @ApiOperation({
    summary: 'Get all products',
    description: 'Retrieve products with optional filtering',
    tags: ['Products']
  })
  async getProducts(
    @Query('category') category: string,
    @Query('minPrice') minPrice: string
  ) {
    return this.productService.findAll(
      category,
      minPrice ? parseFloat(minPrice) : undefined
    );
  }

  @Post('/')
  @ApiOperation({
    summary: 'Create new product',
    description: 'Create a new product with validation',
    tags: ['Products']
  })
  async createProduct(@Body() productData: ProductDto) {
    return this.productService.create(productData);
  }
}

// Aplicación
async function runExamplesDemo() {
  console.log('🎯 EZql Framework - Usage Examples');

  const app = createEZqlApp({
    port: 3004,
    documentation: {
      enabled: true,
      path: '/docs',
      title: 'EZql Examples API',
      version: '1.0.0'
    }
  }).useControllers([ProductController]);

  await app.listen();
  console.log('🚀 Examples running on http://localhost:3004');
  console.log('📖 Documentation at http://localhost:3004/docs');
}

if (require.main === module) {
  runExamplesDemo().catch(console.error);
}

export default runExamplesDemo;