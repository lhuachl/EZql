import { IUpdateQuery } from '../types/fluent-interfaces';
import { IQueryExecutor } from '../core/abstractions';
import { UpdateQueryBuilder } from '../core/query/UpdateQueryBuilder';
import { SqlOperator, SqlValue } from '../types/core';

export class FluentUpdateQuery<T = any> implements IUpdateQuery<T> {
    private queryBuilder: UpdateQueryBuilder;

    constructor(queryExecutor: IQueryExecutor) {
        this.queryBuilder = new UpdateQueryBuilder(queryExecutor);
    }

    table(tableName: string): IUpdateQuery<T> {
        this.queryBuilder.table(tableName);
        return this;
    }

    set(column: string, value: any): IUpdateQuery<T>;
    set(values: Record<string, any>): IUpdateQuery<T>;
    set(columnOrValues: string | Record<string, any>, value?: any): IUpdateQuery<T> {
        if (typeof columnOrValues === 'string') {
            this.queryBuilder.set(columnOrValues, value);
        } else {
            this.queryBuilder.set(columnOrValues);
        }
        return this;
    }

    where(column: string, operator: SqlOperator, value: SqlValue): IUpdateQuery<T>;
    where(column: string, value: SqlValue): IUpdateQuery<T>;
    where(condition: string): IUpdateQuery<T>;
    where(columnOrCondition: string, operatorOrValue?: any, value?: any): IUpdateQuery<T> {
        if (arguments.length === 1) {
            this.queryBuilder.where(columnOrCondition);
        } else if (arguments.length === 2) {
            this.queryBuilder.where(columnOrCondition, operatorOrValue);
        } else {
            this.queryBuilder.where(columnOrCondition, operatorOrValue, value);
        }
        return this;
    }

    whereIn(column: string, values: any[]): IUpdateQuery<T> {
        this.queryBuilder.whereIn(column, values);
        return this;
    }

    whereNotIn(column: string, values: any[]): IUpdateQuery<T> {
        this.queryBuilder.whereNotIn(column, values);
        return this;
    }

    whereBetween(column: string, min: any, max: any): IUpdateQuery<T> {
        this.queryBuilder.whereBetween(column, min, max);
        return this;
    }

    whereNull(column: string): IUpdateQuery<T> {
        this.queryBuilder.whereNull(column);
        return this;
    }

    whereNotNull(column: string): IUpdateQuery<T> {
        this.queryBuilder.whereNotNull(column);
        return this;
    }

    returning(columns: string | string[]): IUpdateQuery<T> {
        this.queryBuilder.returning(columns);
        return this;
    }

    async execute(): Promise<T[]> {
        return await this.queryBuilder.execute<T>();
    }

    toSql(): { query: string; parameters: any[] } {
        const { sql, parameters } = this.queryBuilder.build();
        return { 
            query: sql, 
            parameters: Object.values(parameters) 
        };
    }

    whereRaw(condition: string, ...values: SqlValue[]): IUpdateQuery<T> {
        this.queryBuilder.whereRaw(condition, ...values);
        return this;
    }
}
