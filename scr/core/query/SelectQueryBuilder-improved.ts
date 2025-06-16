// === SELECT QUERY BUILDER MEJORADO ===
// Implementación siguiendo principios SOLID y mejores prácticas

import { 
  IValidatedQueryBuilder, 
  IParameterizedQueryBuilder
} from '../abstractions/improved-index';
import { 
  WhereCondition, 
  OrderByClause, 
  JoinClause, 
  SqlOperator, 
  SqlValue, 
  OrderDirection,
  EZqlError,
  QueryParameters,
  ValidationResult,
  SelectClause,
  GroupByClause,
  AggregateFunction
} from '../../types/core-improved';

/**
 * Builder para queries SELECT con arquitectura mejorada
 * 
 * Principios SOLID aplicados:
 * - SRP: Responsabilidad única - construir queries SELECT
 * - OCP: Extensible a través de métodos adicionales
 * - LSP: Implementa correctamente IQueryBuilder
 * - ISP: Interfaces segregadas por funcionalidad
 * - DIP: Depende de abstracciones (interfaces)
 */
export class SelectQueryBuilder implements 
  IValidatedQueryBuilder<string, QueryParameters>,
  IParameterizedQueryBuilder<string, QueryParameters> {
  
  // === ESTADO INMUTABLE ===
  // Principio: Inmutabilidad para prevenir efectos secundarios
  private readonly selectClause: SelectClause = { columns: [], aggregates: [] };
  private readonly fromClause: string;
  private readonly whereConditions: readonly WhereCondition[];
  private readonly joinClauses: readonly JoinClause[];
  private readonly orderByClause: readonly OrderByClause[];
  private readonly groupByClause: GroupByClause | null;
  private readonly limitClause: number | null;
  private readonly offsetClause: number | null;
  private readonly parameters: Readonly<QueryParameters>;
  private readonly distinctClause: boolean;

  /**
   * Constructor privado para forzar uso del factory method
   * Principio: Builder pattern con validación
   */
  private constructor(options: {
    selectClause?: SelectClause;
    fromClause?: string;
    whereConditions?: WhereCondition[];
    joinClauses?: JoinClause[];
    orderByClause?: OrderByClause[];
    groupByClause?: GroupByClause | null;
    limitClause?: number | null;
    offsetClause?: number | null;
    parameters?: QueryParameters;
    distinctClause?: boolean;
  } = {}) {
    this.selectClause = options.selectClause || { columns: [], aggregates: [] };
    this.fromClause = options.fromClause || '';
    this.whereConditions = Object.freeze(options.whereConditions || []);
    this.joinClauses = Object.freeze(options.joinClauses || []);
    this.orderByClause = Object.freeze(options.orderByClause || []);
    this.groupByClause = options.groupByClause || null;
    this.limitClause = options.limitClause || null;
    this.offsetClause = options.offsetClause || null;
    this.parameters = Object.freeze(options.parameters || {});
    this.distinctClause = options.distinctClause || false;
  }

  /**
   * Factory method para crear nueva instancia
   * Principio: Factory pattern
   */
  static create(): SelectQueryBuilder {
    return new SelectQueryBuilder();
  }

  // === MÉTODOS SELECT ===
  // Principio: Fluent interface con inmutabilidad

  select(columns: string | string[]): SelectQueryBuilder {
    const columnsArray = Array.isArray(columns) ? columns : [columns];
    
    this.validateColumns(columnsArray);
    
    return this.cloneWith({
      selectClause: {
        ...this.selectClause,
        columns: [...this.selectClause.columns, ...columnsArray]
      }
    });
  }

  selectRaw(rawSelect: string): SelectQueryBuilder {
    if (!rawSelect?.trim()) {
      throw new EZqlError('Raw select cannot be empty', 'INVALID_RAW_SELECT');
    }
    
    return this.cloneWith({
      selectClause: {
        ...this.selectClause,
        columns: [...this.selectClause.columns, rawSelect]
      }
    });
  }

  selectDistinct(columns: string | string[]): SelectQueryBuilder {
    return this.select(columns).cloneWith({ distinctClause: true });
  }

  // Métodos de agregación
  count(column: string = '*', alias?: string): SelectQueryBuilder {
    return this.addAggregate('COUNT', column, alias);
  }

  sum(column: string, alias?: string): SelectQueryBuilder {
    return this.addAggregate('SUM', column, alias);
  }

  avg(column: string, alias?: string): SelectQueryBuilder {
    return this.addAggregate('AVG', column, alias);
  }

  min(column: string, alias?: string): SelectQueryBuilder {
    return this.addAggregate('MIN', column, alias);
  }

  max(column: string, alias?: string): SelectQueryBuilder {
    return this.addAggregate('MAX', column, alias);
  }

  private addAggregate(func: AggregateFunction, column: string, alias?: string): SelectQueryBuilder {
    this.validateColumnName(column);
    
    const newAggregate = { function: func, column, alias };
    
    return this.cloneWith({
      selectClause: {
        ...this.selectClause,
        aggregates: [...(this.selectClause.aggregates || []), newAggregate]
      }
    });
  }

  // === MÉTODOS FROM ===

  from(table: string): SelectQueryBuilder {
    this.validateTableName(table);
    
    return this.cloneWith({ fromClause: table });
  }

  fromRaw(rawFrom: string): SelectQueryBuilder {
    if (!rawFrom?.trim()) {
      throw new EZqlError('Raw FROM clause cannot be empty', 'INVALID_RAW_FROM');
    }
    
    return this.cloneWith({ fromClause: rawFrom });
  }

  // === MÉTODOS JOIN ===

  join(table: string, onCondition: string): SelectQueryBuilder {
    return this.addJoin('INNER', table, onCondition);
  }

  leftJoin(table: string, onCondition: string): SelectQueryBuilder {
    return this.addJoin('LEFT', table, onCondition);
  }

  rightJoin(table: string, onCondition: string): SelectQueryBuilder {
    return this.addJoin('RIGHT', table, onCondition);
  }

  innerJoin(table: string, onCondition: string): SelectQueryBuilder {
    return this.addJoin('INNER', table, onCondition);
  }

  fullJoin(table: string, onCondition: string): SelectQueryBuilder {
    return this.addJoin('FULL', table, onCondition);
  }

  private addJoin(type: JoinClause['type'], table: string, onCondition: string): SelectQueryBuilder {
    this.validateTableName(table);
    this.validateJoinCondition(onCondition);
    
    const newJoin: JoinClause = { type, table, onCondition };
    
    return this.cloneWith({
      joinClauses: [...this.joinClauses, newJoin]
    });
  }

  // === MÉTODOS WHERE ===

  where(column: string, operator: SqlOperator, value: SqlValue): SelectQueryBuilder;
  where(column: string, value: SqlValue): SelectQueryBuilder;
  where(condition: string): SelectQueryBuilder;
  where(columnOrCondition: string, operatorOrValue?: any, value?: any): SelectQueryBuilder {
    const condition = this.createWhereCondition(columnOrCondition, operatorOrValue, value);
    
    return this.cloneWith({
      whereConditions: [...this.whereConditions, condition],
      parameters: { ...this.parameters, ...this.extractParameters(condition) }
    });
  }

  whereIn(column: string, values: any[]): SelectQueryBuilder {
    this.validateColumnName(column);
    this.validateInValues(values);
    
    const condition: WhereCondition = {
      type: 'in',
      column,
      operator: 'IN',
      value: values
    };
    
    return this.cloneWith({
      whereConditions: [...this.whereConditions, condition],
      parameters: { ...this.parameters, ...this.extractParameters(condition) }
    });
  }

  whereNotIn(column: string, values: any[]): SelectQueryBuilder {
    this.validateColumnName(column);
    this.validateInValues(values);
    
    const condition: WhereCondition = {
      type: 'in',
      column,
      operator: 'NOT IN',
      value: values
    };
    
    return this.cloneWith({
      whereConditions: [...this.whereConditions, condition],
      parameters: { ...this.parameters, ...this.extractParameters(condition) }
    });
  }

  whereBetween(column: string, min: any, max: any): SelectQueryBuilder {
    this.validateColumnName(column);
    
    const condition: WhereCondition = {
      type: 'between',
      column,
      operator: 'BETWEEN',
      value: [min, max]
    };
    
    return this.cloneWith({
      whereConditions: [...this.whereConditions, condition],
      parameters: { ...this.parameters, ...this.extractParameters(condition) }
    });
  }

  whereNull(column: string): SelectQueryBuilder {
    this.validateColumnName(column);
    
    const condition: WhereCondition = {
      type: 'null',
      column,
      operator: 'IS NULL',
      value: null
    };
    
    return this.cloneWith({
      whereConditions: [...this.whereConditions, condition]
    });
  }

  whereNotNull(column: string): SelectQueryBuilder {
    this.validateColumnName(column);
    
    const condition: WhereCondition = {
      type: 'null',
      column,
      operator: 'IS NOT NULL',
      value: null
    };
    
    return this.cloneWith({
      whereConditions: [...this.whereConditions, condition]
    });
  }

  whereRaw(condition: string, ...values: SqlValue[]): SelectQueryBuilder {
    if (!condition?.trim()) {
      throw new EZqlError('Raw WHERE condition cannot be empty', 'INVALID_RAW_WHERE');
    }
    
    const whereCondition: WhereCondition = {
      type: 'raw',
      column: '',
      operator: 'raw',
      condition,
      value: values
    };
    
    return this.cloneWith({
      whereConditions: [...this.whereConditions, whereCondition],
      parameters: { ...this.parameters, ...this.extractParameters(whereCondition) }
    });
  }

  // === MÉTODOS ORDER BY ===

  orderBy(column: string, direction: OrderDirection = 'ASC'): SelectQueryBuilder {
    this.validateColumnName(column);
    this.validateOrderDirection(direction);
    
    const orderClause: OrderByClause = { column, direction };
    
    return this.cloneWith({
      orderByClause: [...this.orderByClause, orderClause]
    });
  }

  orderByRaw(rawOrder: string): SelectQueryBuilder {
    if (!rawOrder?.trim()) {
      throw new EZqlError('Raw ORDER BY cannot be empty', 'INVALID_RAW_ORDER');
    }
    
    const orderClause: OrderByClause = { column: rawOrder, direction: 'ASC' };
    
    return this.cloneWith({
      orderByClause: [...this.orderByClause, orderClause]
    });
  }

  // === MÉTODOS GROUP BY ===

  groupBy(...columns: string[]): SelectQueryBuilder {
    if (columns.length === 0) {
      throw new EZqlError('GROUP BY requires at least one column', 'INVALID_GROUP_BY');
    }
    
    columns.forEach(col => this.validateColumnName(col));
    
    const groupByClause: GroupByClause = { columns };
    
    return this.cloneWith({ groupByClause });
  }

  having(condition: string): SelectQueryBuilder {
    if (!condition?.trim()) {
      throw new EZqlError('HAVING condition cannot be empty', 'INVALID_HAVING');
    }
    
    const groupByClause: GroupByClause = {
      ...(this.groupByClause || { columns: [] }),
      having: condition
    };
    
    return this.cloneWith({ groupByClause });
  }

  // === MÉTODOS LIMIT/OFFSET ===

  limit(count: number): SelectQueryBuilder {
    this.validateLimitOffset(count, 'LIMIT');
    
    return this.cloneWith({ limitClause: count });
  }

  offset(count: number): SelectQueryBuilder {
    this.validateLimitOffset(count, 'OFFSET');
    
    return this.cloneWith({ offsetClause: count });
  }

  // === IMPLEMENTACIÓN DE INTERFACES ===

  build(): { sql: string; parameters: QueryParameters } {
    const validation = this.validate();
    if (!validation.isValid) {
      throw new EZqlError(
        `Invalid query: ${validation.errors.join(', ')}`,
        'INVALID_QUERY_BUILD'
      );
    }
    
    const sql = this.buildSql();
    return { sql, parameters: this.parameters };
  }

  validate(): ValidationResult {
    const errors: string[] = [];
    
    // Validar FROM clause
    if (!this.fromClause) {
      errors.push('FROM clause is required');
    }
    
    // Validar SELECT clause
    if (this.selectClause.columns.length === 0 && (!this.selectClause.aggregates || this.selectClause.aggregates.length === 0)) {
      errors.push('SELECT clause is required');
    }
    
    // Validar GROUP BY con agregados
    if (this.selectClause.aggregates && this.selectClause.aggregates.length > 0 && !this.groupByClause) {
      if (this.selectClause.columns.length > 0) {
        errors.push('Non-aggregate columns in SELECT require GROUP BY clause');
      }
    }
    
    // Validar HAVING sin GROUP BY
    if (this.groupByClause?.having && (!this.groupByClause.columns || this.groupByClause.columns.length === 0)) {
      errors.push('HAVING clause requires GROUP BY clause');
    }
    
    // Validar OFFSET sin LIMIT
    if (this.offsetClause !== null && this.limitClause === null) {
      errors.push('OFFSET requires LIMIT clause in SQL Server');
    }
    
    return {
      isValid: errors.length === 0,
      errors: Object.freeze(errors)
    };
  }

  isValid(): boolean {
    return this.validate().isValid;
  }

  getParameters(): QueryParameters {
    return { ...this.parameters };
  }

  addParameter(name: string, value: any): void {
    // Este método modifica el estado, violando inmutabilidad
    // En una implementación real, debería devolver una nueva instancia
    throw new EZqlError(
      'Use immutable methods instead of addParameter',
      'DEPRECATED_METHOD'
    );
  }

  clearParameters(): void {
    throw new EZqlError(
      'Use immutable methods instead of clearParameters',
      'DEPRECATED_METHOD'
    );
  }

  reset(): void {
    throw new EZqlError(
      'Use SelectQueryBuilder.create() to get a new instance',
      'DEPRECATED_METHOD'
    );
  }

  clone(): SelectQueryBuilder {
    return this.cloneWith({});
  }

  // === MÉTODOS PRIVADOS ===

  private cloneWith(changes: Partial<{
    selectClause: SelectClause;
    fromClause: string;
    whereConditions: WhereCondition[];
    joinClauses: JoinClause[];
    orderByClause: OrderByClause[];
    groupByClause: GroupByClause | null;
    limitClause: number | null;
    offsetClause: number | null;
    parameters: QueryParameters;
    distinctClause: boolean;
  }>): SelectQueryBuilder {
    return new SelectQueryBuilder({
      selectClause: changes.selectClause || this.selectClause,
      fromClause: changes.fromClause !== undefined ? changes.fromClause : this.fromClause,
      whereConditions: changes.whereConditions || [...this.whereConditions],
      joinClauses: changes.joinClauses || [...this.joinClauses],
      orderByClause: changes.orderByClause || [...this.orderByClause],
      groupByClause: changes.groupByClause !== undefined ? changes.groupByClause : this.groupByClause,
      limitClause: changes.limitClause !== undefined ? changes.limitClause : this.limitClause,
      offsetClause: changes.offsetClause !== undefined ? changes.offsetClause : this.offsetClause,
      parameters: changes.parameters || this.parameters,
      distinctClause: changes.distinctClause !== undefined ? changes.distinctClause : this.distinctClause
    });
  }

  private buildSql(): string {
    let sql = 'SELECT ';
    
    // DISTINCT
    if (this.distinctClause) {
      sql += 'DISTINCT ';
    }
    
    // SELECT clause
    const selectParts: string[] = [];
    
    if (this.selectClause.columns.length > 0) {
      selectParts.push(...this.selectClause.columns);
    }
    
    if (this.selectClause.aggregates) {
      const aggregateParts = this.selectClause.aggregates.map(agg => {
        const aggSql = `${agg.function}(${agg.column})`;
        return agg.alias ? `${aggSql} AS ${agg.alias}` : aggSql;
      });
      selectParts.push(...aggregateParts);
    }
    
    sql += selectParts.length > 0 ? selectParts.join(', ') : '*';
    
    // FROM clause
    sql += ` FROM ${this.fromClause}`;
    
    // JOIN clauses
    if (this.joinClauses.length > 0) {
      const joinSql = this.joinClauses
        .map(join => `${join.type} JOIN ${join.table} ON ${join.onCondition}`)
        .join(' ');
      sql += ` ${joinSql}`;
    }
    
    // WHERE clause
    if (this.whereConditions.length > 0) {
      sql += ` WHERE ${this.buildWhereClause()}`;
    }
    
    // GROUP BY clause
    if (this.groupByClause && this.groupByClause.columns.length > 0) {
      sql += ` GROUP BY ${this.groupByClause.columns.join(', ')}`;
      
      if (this.groupByClause.having) {
        sql += ` HAVING ${this.groupByClause.having}`;
      }
    }
    
    // ORDER BY clause
    if (this.orderByClause.length > 0) {
      const orderSql = this.orderByClause
        .map(order => `${order.column} ${order.direction}`)
        .join(', ');
      sql += ` ORDER BY ${orderSql}`;
    }
    
    // LIMIT and OFFSET (SQL Server style)
    if (this.limitClause !== null) {
      if (this.offsetClause !== null) {
        sql += ` OFFSET ${this.offsetClause} ROWS FETCH NEXT ${this.limitClause} ROWS ONLY`;
      } else {
        sql += ` OFFSET 0 ROWS FETCH NEXT ${this.limitClause} ROWS ONLY`;
      }
    }
    
    return sql;
  }

  private buildWhereClause(): string {
    let paramIndex = Object.keys(this.parameters).length;
    
    return this.whereConditions.map(condition => {
      switch (condition.type) {
        case 'raw':
          return condition.condition || '';
        
        case 'simple':
          return `${condition.column} ${condition.operator} @param${paramIndex++}`;
        
        case 'in':
          const inParams = (condition.value as any[])
            .map(() => `@param${paramIndex++}`)
            .join(', ');
          return `${condition.column} ${condition.operator} (${inParams})`;
        
        case 'between':
          return `${condition.column} BETWEEN @param${paramIndex++} AND @param${paramIndex++}`;
          case 'null':
          return `${condition.column} ${condition.operator}`;
        
        default:
          // Este caso no debería ocurrir si todos los tipos están cubiertos
          throw new EZqlError(
            `Unsupported WHERE condition type: ${(condition as any).type}`,
            'UNSUPPORTED_WHERE_TYPE'
          );
      }
    }).join(' AND ');
  }

  private createWhereCondition(
    columnOrCondition: string, 
    operatorOrValue?: any, 
    value?: any
  ): WhereCondition {
    if (arguments.length === 1) {
      return {
        type: 'raw',
        column: '',
        operator: 'raw',
        condition: columnOrCondition,
        value: undefined
      };
    } else if (arguments.length === 2) {
      return {
        type: 'simple',
        column: columnOrCondition,
        operator: '=',
        value: operatorOrValue
      };
    } else {
      return {
        type: 'simple',
        column: columnOrCondition,
        operator: operatorOrValue,
        value: value
      };
    }
  }

  private extractParameters(condition: WhereCondition): QueryParameters {
    const params: QueryParameters = {};
    let paramIndex = Object.keys(this.parameters).length;
    
    switch (condition.type) {
      case 'simple':
        params[`param${paramIndex}`] = condition.value;
        break;
      
      case 'in':
        (condition.value as any[]).forEach(val => {
          params[`param${paramIndex++}`] = val;
        });
        break;
      
      case 'between':
        const [min, max] = condition.value as [any, any];
        params[`param${paramIndex++}`] = min;
        params[`param${paramIndex++}`] = max;
        break;
      
      case 'raw':
        if (Array.isArray(condition.value)) {
          (condition.value as any[]).forEach(val => {
            params[`param${paramIndex++}`] = val;
          });
        }
        break;
    }
    
    return params;
  }

  // === MÉTODOS DE VALIDACIÓN ===

  private validateColumns(columns: string[]): void {
    if (columns.length === 0) {
      throw new EZqlError('SELECT requires at least one column', 'INVALID_SELECT_COLUMNS');
    }
    
    columns.forEach(col => this.validateColumnName(col));
  }

  private validateColumnName(column: string): void {
    if (!column?.trim()) {
      throw new EZqlError('Column name cannot be empty', 'INVALID_COLUMN_NAME');
    }
    
    // Validación básica de SQL injection
    if (column.includes(';') || column.includes('--')) {
      throw new EZqlError('Invalid characters in column name', 'INVALID_COLUMN_NAME');
    }
  }

  private validateTableName(table: string): void {
    if (!table?.trim()) {
      throw new EZqlError('Table name cannot be empty', 'INVALID_TABLE_NAME');
    }
    
    // Validación básica de SQL injection
    if (table.includes(';') || table.includes('--')) {
      throw new EZqlError('Invalid characters in table name', 'INVALID_TABLE_NAME');
    }
  }

  private validateJoinCondition(condition: string): void {
    if (!condition?.trim()) {
      throw new EZqlError('JOIN condition cannot be empty', 'INVALID_JOIN_CONDITION');
    }
  }

  private validateInValues(values: any[]): void {
    if (!Array.isArray(values) || values.length === 0) {
      throw new EZqlError('IN clause requires non-empty array', 'INVALID_IN_VALUES');
    }
  }

  private validateOrderDirection(direction: OrderDirection): void {
    if (!['ASC', 'DESC'].includes(direction)) {
      throw new EZqlError('Order direction must be ASC or DESC', 'INVALID_ORDER_DIRECTION');
    }
  }

  private validateLimitOffset(count: number, type: string): void {
    if (!Number.isInteger(count) || count < 0) {
      throw new EZqlError(`${type} must be a non-negative integer`, 'INVALID_LIMIT_OFFSET');
    }
  }
}
