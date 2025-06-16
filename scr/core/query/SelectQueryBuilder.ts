import { IQueryBuilder } from '../abstractions';
import { 
  WhereCondition,
  SimpleWhereCondition,
  RawWhereCondition,
  InWhereCondition,
  BetweenWhereCondition,
  NullWhereCondition,
  OrderByClause, 
  JoinClause, 
  SqlOperator, 
  SqlValue, 
  OrderDirection,
  EZqlError,
  QueryParameters 
} from '../../types/core';

export class SelectQueryBuilder implements IQueryBuilder {
  private selectClause: string[] = [];
  private fromClause: string = '';
  private whereConditions: WhereCondition[] = [];
  private joinClauses: JoinClause[] = [];
  private orderByClause: OrderByClause[] = [];
  private groupByClause: string[] = [];
  private havingClause: string = '';
  private limitClause: number | null = null;
  private offsetClause: number | null = null;
  private parameters: any[] = [];

  // SELECT methods
  select(columns: string | string[]): this {
    if (typeof columns === 'string') {
      this.selectClause = [columns];
    } else {
      this.selectClause = [...columns];
    }
    return this;
  }

  selectRaw(rawSelect: string): this {
    this.selectClause = [rawSelect];
    return this;
  }

  // FROM methods
  from(table: string): this {
    this.fromClause = table;
    return this;
  }

  fromRaw(rawFrom: string): this {
    this.fromClause = rawFrom;
    return this;
  }

  // JOIN methods
  join(table: string, onCondition: string): this {
    this.joinClauses.push({
      type: 'INNER',
      table,
      onCondition
    });
    return this;
  }

  leftJoin(table: string, onCondition: string): this {
    this.joinClauses.push({
      type: 'LEFT',
      table,
      onCondition
    });
    return this;
  }
  // WHERE methods
  where(column: string, operator: SqlOperator, value: SqlValue, connector: 'AND' | 'OR' = 'AND'): this {
    const condition: SimpleWhereCondition = {
      type: 'simple',
      column,
      operator,
      value,
      connector: this.whereConditions.length === 0 ? undefined : connector
    };
    this.whereConditions.push(condition);
    return this;
  }

  whereRaw(condition: string, ...values: SqlValue[]): this {
    // Para condiciones raw, simplemente agregamos la condición como está
    // y manejamos los parámetros
    values.forEach(value => this.parameters.push(value));
    const whereCondition: RawWhereCondition = {
      type: 'raw',
      column: '',
      operator: 'raw',
      condition,
      value: values.length > 0 ? values[0] : undefined,
      connector: this.whereConditions.length === 0 ? undefined : 'AND'
    };
    this.whereConditions.push(whereCondition);
    return this;
  }

  // ORDER BY methods
  orderBy(column: string, direction: OrderDirection = 'ASC'): this {
    this.orderByClause.push({ column, direction });
    return this;
  }

  // GROUP BY methods
  groupBy(...columns: string[]): this {
    this.groupByClause.push(...columns);
    return this;
  }

  having(condition: string): this {
    this.havingClause = condition;
    return this;
  }

  // LIMIT and OFFSET
  limit(count: number): this {
    this.limitClause = count;
    return this;
  }

  offset(count: number): this {
    this.offsetClause = count;
    return this;
  }
  // Build the final SQL
  build(): { sql: string; parameters: QueryParameters } {
    this.validate();
    
    let sql = 'SELECT ';
    
    // TOP clause for SQL Server (equivalent to LIMIT)
    if (this.limitClause && !this.offsetClause) {
      sql += `TOP ${this.limitClause} `;
    }
    
    // SELECT clause
    sql += this.selectClause.length > 0 ? this.selectClause.join(', ') : '*';
    
    // FROM clause
    sql += ` FROM ${this.fromClause}`;
    
    // JOIN clauses
    if (this.joinClauses.length > 0) {
      sql += ' ' + this.joinClauses
        .map(join => `${join.type} JOIN ${join.table} ON ${join.onCondition}`)
        .join(' ');
    }
    
    // WHERE clause
    if (this.whereConditions.length > 0) {
      sql += ' WHERE ' + this.buildWhereClause();
    }
    
    // GROUP BY clause
    if (this.groupByClause.length > 0) {
      sql += ` GROUP BY ${this.groupByClause.join(', ')}`;
    }
    
    // HAVING clause
    if (this.havingClause) {
      sql += ` HAVING ${this.havingClause}`;
    }
    
    // ORDER BY clause
    if (this.orderByClause.length > 0) {
      sql += ' ORDER BY ' + this.orderByClause
        .map(order => `${order.column} ${order.direction}`)
        .join(', ');
    }
    
    // OFFSET and FETCH (SQL Server 2012+)
    if (this.offsetClause !== null) {
      // SQL Server requires ORDER BY for OFFSET
      if (this.orderByClause.length === 0) {
        sql += ' ORDER BY (SELECT NULL)';
      }
      sql += ` OFFSET ${this.offsetClause} ROWS`;
      
      if (this.limitClause) {
        sql += ` FETCH NEXT ${this.limitClause} ROWS ONLY`;
      }
    }
      return { sql, parameters: this.getParametersAsObject() };
  }
  
  private getParametersAsObject(): QueryParameters {
    const params: QueryParameters = {};
    this.parameters.forEach((param, index) => {
      params[`param${index}`] = param;
    });
    return params;
  }
  private buildWhereClause(): string {
    return this.whereConditions
      .map((condition, index) => {
        let conditionStr: string;
        
        // Verificar si es una condición raw (cuando column contiene la condición completa)
        if (condition.operator === '=' && condition.value === null) {
          // Es una condición raw
          conditionStr = condition.column;
        } else {
          // Es una condición normal
          const paramPlaceholder = `@param${this.parameters.length}`;
          this.parameters.push(condition.value);
          conditionStr = `${condition.column} ${condition.operator} ${paramPlaceholder}`;
        }
        
        if (index === 0) {
          return conditionStr;
        }
        
        return `${condition.connector} ${conditionStr}`;
      })
      .join(' ');
  }

  getParameters(): any[] {
    return [...this.parameters];
  }

  reset(): void {
    this.selectClause = [];
    this.fromClause = '';
    this.whereConditions = [];
    this.joinClauses = [];
    this.orderByClause = [];
    this.groupByClause = [];
    this.havingClause = '';
    this.limitClause = null;
    this.offsetClause = null;
    this.parameters = [];
  }

  private validate(): void {
    if (!this.fromClause) {
      throw new EZqlError('FROM clause is required', 'VALIDATION_ERROR');
    }
  }

  clone(): SelectQueryBuilder {
    const cloned = new SelectQueryBuilder();
    cloned.selectClause = [...this.selectClause];
    cloned.fromClause = this.fromClause;
    cloned.whereConditions = [...this.whereConditions];
    cloned.joinClauses = [...this.joinClauses];
    cloned.orderByClause = [...this.orderByClause];
    cloned.groupByClause = [...this.groupByClause];
    cloned.havingClause = this.havingClause;
    cloned.limitClause = this.limitClause;
    cloned.offsetClause = this.offsetClause;
    cloned.parameters = [...this.parameters];
    return cloned;
  }
}
