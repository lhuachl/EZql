// === EZql ENTITY - ACTIVE RECORD PATTERN (SIMPLIFIED) ===
// Clase base para entidades con operaciones CRUD integradas

import { EZqlClient } from '../EZqlClient';
import { SqlValue } from '../../types/core';
import { EZqlError } from '../connection/config';

/**
 * Configuración de entidad
 */
export interface EntityConfig {
  tableName: string;
  primaryKey?: string;
  schema?: string;
  timestamps?: boolean;
  softDelete?: boolean;
}

/**
 * Opciones para consultas
 */
export interface FindOptions {
  select?: string[];
  orderBy?: { column: string; direction: 'ASC' | 'DESC' }[];
  limit?: number;
  offset?: number;
}

/**
 * Resultado de operación de inserción
 */
interface InsertResult {
  insertId?: any;
  rowsAffected?: number;
}

/**
 * Clase base EZqlEntity con patrón Active Record
 * 
 * Principios SOLID aplicados:
 * - SRP: Responsabilidad única - manejo de entidades de base de datos
 * - OCP: Extensible para diferentes tipos de entidad
 * - LSP: Las subclases pueden usar todos los métodos de la base
 * - ISP: Interfaces segregadas por funcionalidad
 * - DIP: Depende de EZqlClient (abstracción)
 */
export class EZqlEntity {
  // === CONFIGURACIÓN ESTÁTICA ===
  protected static _client: EZqlClient;
  protected static _config: EntityConfig;
  
  // === PROPIEDADES DE INSTANCIA ===
  protected _isNew: boolean = true;
  protected _originalData: Record<string, any> = {};
  protected _currentData: Record<string, any> = {};
  
  /**
   * Constructor
   */
  constructor(data: Record<string, any> = {}) {
    this._currentData = { ...data };
    this._originalData = { ...data };
    this._isNew = !this.getPrimaryKeyValue();
  }
  
  // === CONFIGURACIÓN ESTÁTICA ===
  
  /**
   * Configura el cliente EZql para esta entidad
   */
  static setClient(client: EZqlClient): void {
    this._client = client;
  }
  
  /**
   * Configura los metadatos de la entidad
   */
  static configure(config: EntityConfig): void {
    this._config = {
      primaryKey: 'id',
      timestamps: false,
      softDelete: false,
      ...config
    };
  }
  
  /**
   * Obtiene la configuración de la entidad
   */
  static getConfig(): EntityConfig {
    if (!this._config) {
      throw new EZqlError(
        `Entity ${this.name} not configured. Call configure() first.`,
        'ENTITY_NOT_CONFIGURED'
      );
    }
    return this._config;
  }
  
  /**
   * Obtiene el cliente EZql
   */
  static getClient(): EZqlClient {
    if (!this._client) {
      throw new EZqlError(
        `No EZqlClient configured for entity ${this.name}. Call setClient() first.`,
        'CLIENT_NOT_CONFIGURED'
      );
    }
    return this._client;
  }
  
  // === MÉTODOS ESTÁTICOS (CONSULTAS) ===
  
  /**
   * Busca una entidad por su clave primaria
   */
  static async findById<T extends EZqlEntity>(
    this: new(data?: any) => T,
    id: SqlValue
  ): Promise<T | null> {
    const EntityClass = this as any;
    const config = EntityClass.getConfig();
    const client = EntityClass.getClient();
    
    const results = await client
      .select()
      .from(config.tableName)
      .where(config.primaryKey!, id)
      .execute();
    
    if (results.length === 0) {
      return null;
    }
    
    return new this(results[0]);
  }
  
  /**
   * Busca entidades por parámetros específicos
   */
  static async findByParameter<T extends EZqlEntity>(
    this: new(data?: any) => T,
    parameters: Record<string, SqlValue>,
    options: FindOptions = {}
  ): Promise<T[]> {
    const EntityClass = this as any;
    const config = EntityClass.getConfig();
    const client = EntityClass.getClient();
    
    let query = client.select(options.select || ['*']).from(config.tableName);
    
    // Aplicar condiciones WHERE
    for (const [key, value] of Object.entries(parameters)) {
      query = query.where(key, value);
    }
    
    // Aplicar ORDER BY
    if (options.orderBy) {
      for (const order of options.orderBy) {
        query = query.orderBy(order.column, order.direction);
      }
    }
    
    // Aplicar LIMIT y OFFSET
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    if (options.offset) {
      query = query.offset(options.offset);
    }
    
    const results = await query.execute();
    return results.map((data: any) => new this(data));
  }
    /**
   * Busca una sola entidad por parámetros
   */
  static async findOneByParameter<T extends EZqlEntity>(
    this: new(data?: any) => T,
    parameters: Record<string, SqlValue>
  ): Promise<T | null> {
    const EntityClass = this as any;
    const results = await EntityClass.findByParameter.call(this, parameters, { limit: 1 });
    return results.length > 0 ? results[0] : null;
  }
  
  /**
   * Busca todas las entidades
   */
  static async findAll<T extends EZqlEntity>(
    this: new(data?: any) => T,
    options: FindOptions = {}
  ): Promise<T[]> {
    const EntityClass = this as any;
    const config = EntityClass.getConfig();
    const client = EntityClass.getClient();
    
    let query = client.select(options.select || ['*']).from(config.tableName);
    
    // Aplicar ORDER BY
    if (options.orderBy) {
      for (const order of options.orderBy) {
        query = query.orderBy(order.column, order.direction);
      }
    }
    
    // Aplicar LIMIT y OFFSET
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    if (options.offset) {
      query = query.offset(options.offset);
    }
    
    const results = await query.execute();
    return results.map((data: any) => new this(data));
  }
  
  /**
   * Crea una nueva instancia sin persistir
   */
  static createInstance<T extends EZqlEntity>(
    this: new(data?: any) => T,
    data: Record<string, any>
  ): T {
    return new this(data);
  }
  
  // === MÉTODOS DE INSTANCIA ===
  
  /**
   * Obtiene el valor de la clave primaria
   */
  protected getPrimaryKeyValue(): SqlValue | undefined {
    const config = (this.constructor as typeof EZqlEntity).getConfig();
    return this._currentData[config.primaryKey!];
  }
  
  /**
   * Establece el valor de la clave primaria
   */
  protected setPrimaryKeyValue(value: SqlValue): void {
    const config = (this.constructor as typeof EZqlEntity).getConfig();
    this._currentData[config.primaryKey!] = value;
  }
  
  /**
   * Obtiene una propiedad de la entidad
   */
  get(key: string): any {
    return this._currentData[key];
  }
  
  /**
   * Establece una propiedad de la entidad
   */
  set(key: string, value: any): void {
    this._currentData[key] = value;
  }
  
  /**
   * Establece múltiples propiedades
   */
  setData(data: Record<string, any>): void {
    Object.assign(this._currentData, data);
  }
  
  /**
   * Obtiene todos los datos actuales
   */
  getData(): Record<string, any> {
    return { ...this._currentData };
  }
  
  /**
   * Verifica si la entidad ha sido modificada
   */
  isDirty(): boolean {
    return JSON.stringify(this._currentData) !== JSON.stringify(this._originalData);
  }
  
  /**
   * Verifica si es una nueva entidad
   */
  isNew(): boolean {
    return this._isNew;
  }
  
  /**
   * Guarda la entidad (INSERT o UPDATE)
   */
  async save(): Promise<this> {
    const config = (this.constructor as typeof EZqlEntity).getConfig();
    const client = (this.constructor as typeof EZqlEntity).getClient();
    
    if (this._isNew) {
      // INSERT
      const insertData = { ...this._currentData };
      
      // Agregar timestamps si están habilitados
      if (config.timestamps) {
        insertData['created_at'] = new Date();
        insertData['updated_at'] = new Date();
      }
      
      const result = await client
        .insert()
        .into(config.tableName!)
        .values(insertData)
        .execute() as InsertResult;
      
      // Si la base de datos genera el ID, actualizarlo
      if (result && result.insertId) {
        this.setPrimaryKeyValue(result.insertId);
      }
      
      this._isNew = false;
    } else {
      // UPDATE
      const updateData = { ...this._currentData };
      
      // Agregar timestamp de actualización
      if (config.timestamps) {
        updateData['updated_at'] = new Date();
      }
      
      await client
        .update()
        .table(config.tableName!)
        .set(updateData)
        .where(config.primaryKey!, this.getPrimaryKeyValue())
        .execute();
    }
    
    // Actualizar datos originales
    this._originalData = { ...this._currentData };
    
    return this;
  }
  
  /**
   * Actualiza la entidad con nuevos datos
   */
  async updateEntity(data: Record<string, any>): Promise<this> {
    this.setData(data);
    return this.save();
  }
  
  /**
   * Elimina la entidad
   */
  async deleteInstance(): Promise<boolean> {
    if (this._isNew) {
      throw new EZqlError(
        'Cannot delete unsaved entity',
        'DELETE_UNSAVED_ENTITY'
      );
    }
    
    const config = (this.constructor as typeof EZqlEntity).getConfig();
    const client = (this.constructor as typeof EZqlEntity).getClient();
    
    if (config.softDelete) {
      // Soft delete
      await client
        .update()
        .table(config.tableName!)
        .set({ deleted_at: new Date() })
        .where(config.primaryKey!, this.getPrimaryKeyValue())
        .execute();
    } else {
      // Hard delete
      await client
        .delete()
        .from(config.tableName!)
        .where(config.primaryKey!, this.getPrimaryKeyValue())
        .execute();
    }
    
    return true;
  }
  
  /**
   * Recarga la entidad desde la base de datos
   */
  async reload(): Promise<this> {
    if (this._isNew) {
      throw new EZqlError(
        'Cannot reload unsaved entity',
        'RELOAD_UNSAVED_ENTITY'
      );
    }
    
    const config = (this.constructor as typeof EZqlEntity).getConfig();
    const client = (this.constructor as typeof EZqlEntity).getClient();
    
    const results = await client
      .select()
      .from(config.tableName!)
      .where(config.primaryKey!, this.getPrimaryKeyValue())
      .execute();
    
    if (results.length === 0) {
      throw new EZqlError(
        'Entity not found in database',
        'ENTITY_NOT_FOUND'
      );
    }
    
    this._currentData = results[0];
    this._originalData = { ...results[0] };
    
    return this;
  }
  
  /**
   * Convierte la entidad a objeto plano
   */
  toJSON(): Record<string, any> {
    return this.getData();
  }
  
  /**
   * Representación en string de la entidad
   */
  toString(): string {
    const config = (this.constructor as typeof EZqlEntity).getConfig();
    const pkValue = this.getPrimaryKeyValue();
    return `${this.constructor.name}(${config.primaryKey}=${pkValue})`;
  }
}
