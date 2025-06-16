import { SqlOperator, SqlValue, OrderDirection, JoinType } from './core';

// Interface base para query
export interface IBaseQuery<T = any> {
  execute(): Promise<T[]>;
  toSql(): { query: string; parameters: any[] };
}

// Interfaces principales para la API fluida - simplificadas
export interface ISelectQuery<T = any> extends IBaseQuery<T> {
  select(columns: string | string[]): ISelectQuery<T>;
  selectRaw(rawSelect: string): ISelectQuery<T>;
  columns(columns: string | string[]): ISelectQuery<T>;
  from(table: string): ISelectQuery<T>;
  fromRaw(rawFrom: string): ISelectQuery<T>;
  
  // WHERE methods
  where(column: string, operator: SqlOperator, value: SqlValue): ISelectQuery<T>;
  where(column: string, value: SqlValue): ISelectQuery<T>;
  whereRaw(condition: string, ...values: SqlValue[]): ISelectQuery<T>;
  
  // Chaining WHERE
  and(column: string, operator: SqlOperator, value: SqlValue): ISelectQuery<T>;
  and(column: string, value: SqlValue): ISelectQuery<T>;
  or(column: string, operator: SqlOperator, value: SqlValue): ISelectQuery<T>;
  or(column: string, value: SqlValue): ISelectQuery<T>;
  
  // JOIN methods
  join(table: string, onCondition: string): ISelectQuery<T>;
  leftJoin(table: string, onCondition: string): ISelectQuery<T>;
  rightJoin(table: string, onCondition: string): ISelectQuery<T>;
  
  // ORDER BY methods
  orderBy(column: string, direction?: OrderDirection): ISelectQuery<T>;
  thenBy(column: string, direction?: OrderDirection): ISelectQuery<T>;
  
  // GROUP BY methods
  groupBy(...columns: string[]): ISelectQuery<T>;
  having(condition: string): ISelectQuery<T>;
  
  // LIMIT and OFFSET
  limit(count: number): ISelectQuery<T>;
  offset(count: number): ISelectQuery<T>;
}

// Interface for INSERT operations
export interface IInsertQuery<T = any> extends IBaseQuery<T> {
  into(table: string): IInsertQuery<T>;
  value(column: string, value: any): IInsertQuery<T>;
  values(data: Record<string, any>): IInsertQuery<T>;
  multipleRows(rows: Record<string, any>[]): IInsertQuery<T>;
  returning(columns: string | string[]): IInsertQuery<T>;
}

// Interface for UPDATE operations
export interface IUpdateQuery<T = any> extends IBaseQuery<T> {
  table(tableName: string): IUpdateQuery<T>;
  set(column: string, value: any): IUpdateQuery<T>;
  set(values: Record<string, any>): IUpdateQuery<T>;
  
  // WHERE methods
  where(column: string, operator: SqlOperator, value: SqlValue): IUpdateQuery<T>;
  where(column: string, value: SqlValue): IUpdateQuery<T>;
  where(condition: string): IUpdateQuery<T>;
  whereIn(column: string, values: any[]): IUpdateQuery<T>;
  whereNotIn(column: string, values: any[]): IUpdateQuery<T>;
  whereBetween(column: string, min: any, max: any): IUpdateQuery<T>;
  whereNull(column: string): IUpdateQuery<T>;
  whereNotNull(column: string): IUpdateQuery<T>;
  
  returning(columns: string | string[]): IUpdateQuery<T>;
}

// Interface for DELETE operations
export interface IDeleteQuery<T = any> extends IBaseQuery<T> {
  from(tableName: string): IDeleteQuery<T>;
  
  // WHERE methods
  where(column: string, operator: SqlOperator, value: SqlValue): IDeleteQuery<T>;
  where(column: string, value: SqlValue): IDeleteQuery<T>;
  where(condition: string): IDeleteQuery<T>;
  whereIn(column: string, values: any[]): IDeleteQuery<T>;
  whereNotIn(column: string, values: any[]): IDeleteQuery<T>;
  whereBetween(column: string, min: any, max: any): IDeleteQuery<T>;
  whereNull(column: string): IDeleteQuery<T>;
  whereNotNull(column: string): IDeleteQuery<T>;
  
  returning(columns: string | string[]): IDeleteQuery<T>;
}

// Interface principal del ORM
export interface IEZqlClient {
  // SELECT queries
  select<T = any>(): ISelectQuery<T>;
  select<T = any>(columns: string | string[]): ISelectQuery<T>;
  
  // Otros tipos de query
  insert<T = any>(): IInsertQuery<T>;
  update<T = any>(): IUpdateQuery<T>;
  delete<T = any>(): IDeleteQuery<T>;
  
  // Query raw para casos complejos
  raw<T = any>(query: string, ...parameters: SqlValue[]): Promise<T[]>;
  
  // Transacciones
  transaction<T>(fn: (client: IEZqlClient) => Promise<T>): Promise<T>;
  
  // Gestión de conexión
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

// Mantenemos las otras interfaces simples para compatibilidad
export interface IFromQuery<T = any> extends ISelectQuery<T> {}
export interface IWhereQuery<T = any> extends ISelectQuery<T> {}
export interface IChainableQuery<T = any> extends ISelectQuery<T> {}
export interface IGroupCondition<T = any> extends ISelectQuery<T> {}
export interface IOrderableQuery<T = any> extends ISelectQuery<T> {}
export interface IGroupableQuery<T = any> extends ISelectQuery<T> {}
export interface ILimitableQuery<T = any> extends ISelectQuery<T> {}
