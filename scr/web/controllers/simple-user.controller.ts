// === CONTROLADOR SIMPLIFICADO DE USUARIOS ===
// Versión funcional para demostración del framework web

import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  Db
} from '../decorators';
import { Injectable } from '../di-container';
import { EZqlClient } from '../../core/EZqlClient';
import { ApiResponse, ValidationResult } from '../types';

// === DTOs SIMPLIFICADOS ===

export interface CreateUserDto {
  name: string;
  email: string;
  password?: string;
  active?: boolean;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  active?: boolean;
}

export interface UserQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
}

// === SERVICIO DE USUARIOS ===

@Injectable()
export class UserService {
  constructor(private db: EZqlClient) {}

  async findAll(query: UserQueryDto = {}): Promise<{ users: any[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const offset = (page - 1) * limit;

    let selectQuery = this.db
      .select(['id', 'name', 'email', 'active', 'created_at', 'updated_at'])
      .from('users');

    // Aplicar filtros
    if (query.search) {
      selectQuery = selectQuery.where('name', 'LIKE', `%${query.search}%`);
    }

    if (query.active !== undefined) {
      selectQuery = selectQuery.where('active', query.active);
    }

    // Ejecutar query con paginación
    const users = await selectQuery
      .limit(limit)
      .offset(offset)
      .execute();

    // Contar total (simplificado)
    const total = users.length; // En una implementación real, haríamos COUNT(*) separado

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
      .execute();

    return result[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete()
      .from('users')
      .where('id', id)
      .execute();

    return result.length > 0;
  }
}

// === CONTROLADOR DE USUARIOS ===

@Controller('/api/users')
@Injectable()
export class UserController {
  constructor(private userService: UserService) {}

  @Get('/')
  async findAll(@Query() query: UserQueryDto): Promise<ApiResponse> {
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

  @Get('/search/:term')
  async search(@Param('term') term: string, @Db() db: EZqlClient): Promise<ApiResponse> {
    const users = await db
      .select(['id', 'name', 'email', 'active'])
      .from('users')
      .where('name', 'LIKE', `%${term}%`)
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
  @Get('/')
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
