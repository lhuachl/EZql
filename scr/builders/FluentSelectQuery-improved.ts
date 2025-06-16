import {
  ISelectQuery
} from '../types/fluent-interfaces';
import { SqlOperator, SqlValue, OrderDirection, EZqlError, QueryParameters } from '../types/core';
import { IQueryExecutor } from '../core/abstractions';
import { SelectQueryBuilder } from '../core/query/SelectQueryBuilder-improved';

/**
 * FluentSelectQuery implementation using improved SelectQueryBuilder
 * Implements SOLID principles through composition and immutability
 */
export class FluentSelectQuery<T> implements ISelectQuery<T> {
  private queryBuilder: SelectQueryBuilder;

  constructor(private queryExecutor: IQueryExecutor) {
    this.queryBuilder = SelectQueryBuilder.create();
  }

  // === SELECT METHODS ===
  
  select(columns: string | string[]): ISelectQuery<T> {
    this.queryBuilder = this.queryBuilder.select(columns);
    return this;
  }

  selectRaw(rawSelect: string): ISelectQuery<T> {
    this.queryBuilder = this.queryBuilder.selectRaw(rawSelect);
    return this;
  }

  columns(columns: string | string[]): ISelectQuery<T> {
    this.queryBuilder = this.queryBuilder.select(columns);
    return this;
  }

  // === FROM METHODS ===
  
  from(table: string): ISelectQuery<T> {
    this.queryBuilder = this.queryBuilder.from(table);
    return this;
  }

  fromRaw(rawFrom: string): ISelectQuery<T> {
    this.queryBuilder = this.queryBuilder.fromRaw(rawFrom);
    return this;
  }

  // === JOIN METHODS ===
  
  join(table: string, onCondition: string): ISelectQuery<T> {
    this.queryBuilder = this.queryBuilder.join(table, onCondition);
    return this;
  }

  leftJoin(table: string, onCondition: string): ISelectQuery<T> {
    this.queryBuilder = this.queryBuilder.leftJoin(table, onCondition);
    return this;
  }

  rightJoin(table: string, onCondition: string): ISelectQuery<T> {
    this.queryBuilder = this.queryBuilder.rightJoin(table, onCondition);
    return this;
  }

  innerJoin(table: string, onCondition: string): ISelectQuery<T> {
    this.queryBuilder = this.queryBuilder.innerJoin(table, onCondition);
    return this;
  }

  fullJoin(table: string, onCondition: string): ISelectQuery<T> {
    this.queryBuilder = this.queryBuilder.fullJoin(table, onCondition);
    return this;
  }

  // === WHERE METHODS ===
  
  where(column: string, operator: SqlOperator, value: SqlValue): ISelectQuery<T>;
  where(column: string, value: SqlValue): ISelectQuery<T>;
  where(condition: string): ISelectQuery<T>;
  where(columnOrCondition: string, operatorOrValue?: SqlOperator | SqlValue, value?: SqlValue): ISelectQuery<T> {
    this.queryBuilder = this.queryBuilder.where(columnOrCondition as any, operatorOrValue as any, value);
    return this;
  }

  whereRaw(condition: string, ...values: SqlValue[]): ISelectQuery<T> {
    this.queryBuilder = this.queryBuilder.whereRaw(condition, ...values);
    return this;
  }

  whereIn(column: string, values: any[]): ISelectQuery<T> {
    this.queryBuilder = this.queryBuilder.whereIn(column, values);
    return this;
  }

  whereNotIn(column: string, values: any[]): ISelectQuery<T> {
    this.queryBuilder = this.queryBuilder.whereNotIn(column, values);
    return this;
  }

  whereBetween(column: string, min: any, max: any): ISelectQuery<T> {
    this.queryBuilder = this.queryBuilder.whereBetween(column, min, max);
    return this;
  }

  whereNull(column: string): ISelectQuery<T> {
    this.queryBuilder = this.queryBuilder.whereNull(column);
    return this;
  }

  whereNotNull(column: string): ISelectQuery<T> {
    this.queryBuilder = this.queryBuilder.whereNotNull(column);
    return this;
  }

  // === LOGICAL CHAINING ===
  
  and(column: string, operator: SqlOperator, value: SqlValue): ISelectQuery<T>;
  and(column: string, value: SqlValue): ISelectQuery<T>;
  and(column: string, operatorOrValue: SqlOperator | SqlValue, value?: SqlValue): ISelectQuery<T> {
    // AND is the default connector, so we can just use where()
    return this.where(column, operatorOrValue as any, value);
  }

  or(column: string, operator: SqlOperator, value: SqlValue): ISelectQuery<T>;
  or(column: string, value: SqlValue): ISelectQuery<T>;
  or(column: string, operatorOrValue: SqlOperator | SqlValue, value?: SqlValue): ISelectQuery<T> {
    // For OR logic, we need to implement OR connector in improved builder
    // For now, delegate to where() - this would need enhancement in the builder
    return this.where(column, operatorOrValue as any, value);
  }

  // === ORDER BY METHODS ===
  
  orderBy(column: string, direction: OrderDirection = 'ASC'): ISelectQuery<T> {
    this.queryBuilder = this.queryBuilder.orderBy(column, direction);
    return this;
  }

  thenBy(column: string, direction: OrderDirection = 'ASC'): ISelectQuery<T> {
    this.queryBuilder = this.queryBuilder.orderBy(column, direction);
    return this;
  }

  // === GROUP BY METHODS ===
  
  groupBy(...columns: string[]): ISelectQuery<T> {
    this.queryBuilder = this.queryBuilder.groupBy(...columns);
    return this;
  }

  having(condition: string): ISelectQuery<T> {
    this.queryBuilder = this.queryBuilder.having(condition);
    return this;
  }

  // === LIMIT AND OFFSET ===
  
  limit(count: number): ISelectQuery<T> {
    this.queryBuilder = this.queryBuilder.limit(count);
    return this;
  }

  offset(count: number): ISelectQuery<T> {
    this.queryBuilder = this.queryBuilder.offset(count);
    return this;
  }

  // === EXECUTION ===
  
  async execute(): Promise<T[]> {
    const { sql, parameters } = this.queryBuilder.build();
    
    try {
      return await this.queryExecutor.execute<T>(sql, parameters);
    } catch (error: any) {
      throw new EZqlError(
        `Query execution failed: ${error.message}`,
        'EXECUTION_ERROR',
        error
      );
    }
  }

  // === UTILITY METHODS ===
  
  toSql(): { query: string; parameters: any[] } {
    const { sql, parameters } = this.queryBuilder.build();
    
    // Convert QueryParameters to any[] for backward compatibility
    const paramArray: any[] = Object.values(parameters);
    
    return {
      query: sql,
      parameters: paramArray
    };
  }

  clone(): FluentSelectQuery<T> {
    const cloned = new FluentSelectQuery<T>(this.queryExecutor);
    cloned.queryBuilder = this.queryBuilder.clone();
    return cloned;
  }
}
