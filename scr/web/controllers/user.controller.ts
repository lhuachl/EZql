// === CONTROLADOR DE EJEMPLO USANDO DECORADORES ===
// Principio: Demostración del framework web con sintaxis declarativa

import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  Db,
  UseMiddleware,
  ValidateBody,
  ApiOperation
} from '../decorators';
import { Injectable } from '../di-container';
import { EZqlClient } from '../../core/EZqlClient';
import { PaginatedResponse, ApiResponse, ValidationResult } from '../types';
import { authMiddleware, loggingMiddleware } from '../application';

// === DTOs DE VALIDACIÓN ===

export class CreateUserDto {
  name!: string;
  email!: string;
  password?: string;
  active?: boolean;

  async validate(): Promise<ValidationResult> {
    const errors = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Name is required',
        code: 'REQUIRED'
      });
    }

    if (!this.email || !this.email.includes('@')) {
      errors.push({
        field: 'email',
        message: 'Valid email is required',
        code: 'INVALID_EMAIL'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export class UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  active?: boolean;

  async validate(): Promise<ValidationResult> {
    const errors = [];

    if (this.email && !this.email.includes('@')) {
      errors.push({
        field: 'email',
        message: 'Valid email is required',
        code: 'INVALID_EMAIL'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export class UserQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
  sort?: 'name' | 'email' | 'created_at';
  order?: 'ASC' | 'DESC';

  async validate(): Promise<ValidationResult> {
    const errors = [];

    if (this.page && (this.page < 1 || !Number.isInteger(this.page))) {
      errors.push({
        field: 'page',
        message: 'Page must be a positive integer',
        code: 'INVALID_PAGE'
      });
    }

    if (this.limit && (this.limit < 1 || this.limit > 100 || !Number.isInteger(this.limit))) {
      errors.push({
        field: 'limit',
        message: 'Limit must be between 1 and 100',
        code: 'INVALID_LIMIT'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// === SERVICIO DE USUARIOS ===

@Injectable()
export class UserService {
  constructor(private db: EZqlClient) {}

  async findAll(query: UserQueryDto): Promise<{ users: any[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const offset = (page - 1) * limit;

    let selectQuery = this.db
      .select(['id', 'name', 'email', 'active', 'created_at', 'updated_at'])
      .from('users');    // Aplicar filtros
    if (query.search) {
      selectQuery = selectQuery.where(`(name LIKE '%${query.search}%' OR email LIKE '%${query.search}%')`);
    }

    if (query.active !== undefined) {
      selectQuery = selectQuery.where('active', query.active);
    }

    // Aplicar ordenamiento
    if (query.sort) {
      selectQuery = selectQuery.orderBy(query.sort, query.order || 'ASC');
    }

    // Ejecutar query con paginación
    const users = await selectQuery
      .limit(limit)
      .offset(offset)
      .execute();

    // Contar total (sin paginación)
    const countResult = await this.db
      .select(['COUNT(*) as total'])
      .from('users')
      .execute();

    const total = countResult[0]?.total || 0;

    return { users, total, page, limit };
  }

  async findById(id: number): Promise<any> {
    const users = await this.db
      .select(['id', 'name', 'email', 'active', 'created_at', 'updated_at'])
      .from('users')
      .where('id', id)
      .execute();

    return users[0] || null;
  }

  async create(userData: CreateUserDto): Promise<any> {
    const result = await this.db
      .insert()
      .into('users')
      .values({
        name: userData.name,
        email: userData.email,
        password: userData.password || 'default_password',
        active: userData.active !== undefined ? userData.active : true,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning(['id', 'name', 'email', 'active'])
      .execute();

    return result[0];
  }

  async update(id: number, userData: UpdateUserDto): Promise<any> {
    const updateData: any = {
      updated_at: new Date()
    };

    if (userData.name !== undefined) updateData.name = userData.name;
    if (userData.email !== undefined) updateData.email = userData.email;
    if (userData.password !== undefined) updateData.password = userData.password;
    if (userData.active !== undefined) updateData.active = userData.active;

    const result = await this.db
      .update()
      .table('users')
      .set(updateData)
      .where('id', id)
      .returning(['id', 'name', 'email', 'active', 'updated_at'])
      .execute();

    return result[0] || null;
  }
  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete()
      .from('users')
      .where('id', id)
      .execute();

    // En EZql, el delete retorna un array vacío si es exitoso
    return Array.isArray(result);
  }

  async bulkCreate(usersData: CreateUserDto[]): Promise<any[]> {
    const values = usersData.map(user => ({
      name: user.name,
      email: user.email,
      password: user.password || 'default_password',
      active: user.active !== undefined ? user.active : true,
      created_at: new Date(),
      updated_at: new Date()
    }));

    return await this.db
      .insert()
      .into('users')
      .multipleRows(values)
      .returning(['id', 'name', 'email', 'active'])
      .execute();
  }
  async findUsersWithStats(): Promise<any[]> {
    return await this.db
      .select([
        'u.id',
        'u.name',
        'u.email',
        'COUNT(o.id) as order_count',
        'COALESCE(SUM(o.total), 0) as total_spent'
      ])
      .from('users u')
      .leftJoin('orders o', 'u.id = o.user_id')
      .groupBy('u.id')
      .groupBy('u.name')
      .groupBy('u.email')
      .orderBy('total_spent', 'DESC')
      .execute();
  }
}

// === CONTROLADOR DE USUARIOS ===

@Controller('/api/users')
@UseMiddleware(loggingMiddleware())
@Injectable()
export class UserController {
  constructor(private userService: UserService) {}

  @Get('/')
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieve a paginated list of users with optional filtering',
    tags: ['Users']
  })
  async findAll(@Query() query: UserQueryDto): Promise<PaginatedResponse<any>> {
    const result = await this.userService.findAll(query);
    
    return {
      success: true,
      data: result.users,
      metadata: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit)
      },
      timestamp: new Date()
    };
  }

  @Get('/:id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve a specific user by their ID',
    tags: ['Users']
  })
  async findOne(@Param('id') id: string): Promise<ApiResponse> {
    const userId = parseInt(id);
    const user = await this.userService.findById(userId);
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    return {
      success: true,
      data: user,
      timestamp: new Date()
    };
  }

  @Post('/')
  @ValidateBody(CreateUserDto)
  @ApiOperation({
    summary: 'Create new user',
    description: 'Create a new user with the provided data',
    tags: ['Users']
  })
  async create(@Body() userData: CreateUserDto): Promise<ApiResponse> {
    const user = await this.userService.create(userData);
    
    return {
      success: true,
      data: user,
      message: 'User created successfully',
      timestamp: new Date()
    };
  }

  @Put('/:id')
  @ValidateBody(UpdateUserDto)
  @ApiOperation({
    summary: 'Update user',
    description: 'Update an existing user with the provided data',
    tags: ['Users']
  })
  async update(
    @Param('id') id: string,
    @Body() userData: UpdateUserDto
  ): Promise<ApiResponse> {
    const userId = parseInt(id);
    const user = await this.userService.update(userId, userData);
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    return {
      success: true,
      data: user,
      message: 'User updated successfully',
      timestamp: new Date()
    };
  }

  @Delete('/:id')
  @UseMiddleware(authMiddleware())
  @ApiOperation({
    summary: 'Delete user',
    description: 'Delete a user by their ID (requires authentication)',
    tags: ['Users']
  })
  async delete(@Param('id') id: string): Promise<ApiResponse> {
    const userId = parseInt(id);
    const deleted = await this.userService.delete(userId);
    
    if (!deleted) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    return {
      success: true,
      message: 'User deleted successfully',
      timestamp: new Date()
    };
  }

  @Post('/bulk')
  @ValidateBody((data: CreateUserDto[]) => {
    if (!Array.isArray(data)) {
      return {
        isValid: false,
        errors: [{ field: 'body', message: 'Expected array of users', code: 'INVALID_TYPE' }]
      };
    }
    return { isValid: true };
  })
  @ApiOperation({
    summary: 'Bulk create users',
    description: 'Create multiple users at once',
    tags: ['Users']
  })
  async bulkCreate(@Body() usersData: CreateUserDto[]): Promise<ApiResponse> {
    const users = await this.userService.bulkCreate(usersData);
    
    return {
      success: true,
      data: users,
      message: `${users.length} users created successfully`,
      timestamp: new Date()
    };
  }

  @Get('/stats/with-orders')
  @ApiOperation({
    summary: 'Get users with order statistics',
    description: 'Retrieve users along with their order count and total spent',
    tags: ['Users', 'Statistics']
  })
  async getUsersWithStats(): Promise<ApiResponse> {
    const users = await this.userService.findUsersWithStats();
    
    return {
      success: true,
      data: users,
      timestamp: new Date()
    };
  }

  @Get('/search/:term')
  @ApiOperation({
    summary: 'Search users',
    description: 'Search users by name or email',
    tags: ['Users']
  })  async search(@Param('term') term: string, @Db() db: EZqlClient): Promise<ApiResponse> {
    const users = await db
      .select(['id', 'name', 'email', 'active'])
      .from('users')
      .where(`name LIKE '%${term}%' OR email LIKE '%${term}%'`)
      .orderBy('name', 'ASC')
      .execute();
    
    return {
      success: true,
      data: users,
      message: `Found ${users.length} users matching "${term}"`,
      timestamp: new Date()
    };
  }
}

// === CONTROLADOR DE SALUD ===

@Controller('/health')
@Injectable()
export class HealthController {
  constructor() {}

  @Get('/')
  @ApiOperation({
    summary: 'Health check',
    description: 'Check the health status of the application',
    tags: ['System']
  })
  async healthCheck(@Db() db: EZqlClient): Promise<ApiResponse> {
    const health = {
      status: 'ok',
      timestamp: new Date(),
      database: {
        connected: db.isConnected()
      },
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };

    return {
      success: true,
      data: health,
      timestamp: new Date()
    };
  }

  @Get('/database')
  @ApiOperation({
    summary: 'Database health check',
    description: 'Check the database connection and perform a test query',
    tags: ['System', 'Database']
  })
  async databaseCheck(@Db() db: EZqlClient): Promise<ApiResponse> {
    try {
      const dbHealth = await db.healthCheck();
      const testQuery = await db.raw('SELECT 1 as test');
      
      return {
        success: true,
        data: {
          ...dbHealth,
          testQuery: testQuery[0]?.test === 1
        },
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
