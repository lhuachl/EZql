import { IDeleteQuery } from '../types/fluent-interfaces';
import { IQueryExecutor } from '../core/abstractions';
import { DeleteQueryBuilder } from '../core/query/DeleteQueryBuilder';
import { SqlOperator, SqlValue } from '../types/core';

export class FluentDeleteQuery<T = any> implements IDeleteQuery<T> {
    private queryBuilder: DeleteQueryBuilder;

    constructor(queryExecutor: IQueryExecutor) {
        this.queryBuilder = new DeleteQueryBuilder(queryExecutor);
    }

    from(tableName: string): IDeleteQuery<T> {
        this.queryBuilder.from(tableName);
        return this;
    }

    where(column: string, operator: SqlOperator, value: SqlValue): IDeleteQuery<T>;
    where(column: string, value: SqlValue): IDeleteQuery<T>;
    where(condition: string): IDeleteQuery<T>;
    where(columnOrCondition: string, operatorOrValue?: any, value?: any): IDeleteQuery<T> {
        if (arguments.length === 1) {
            this.queryBuilder.where(columnOrCondition);
        } else if (arguments.length === 2) {
            this.queryBuilder.where(columnOrCondition, operatorOrValue);
        } else {
            this.queryBuilder.where(columnOrCondition, operatorOrValue, value);
        }
        return this;
    }

    whereIn(column: string, values: any[]): IDeleteQuery<T> {
        this.queryBuilder.whereIn(column, values);
        return this;
    }

    whereNotIn(column: string, values: any[]): IDeleteQuery<T> {
        this.queryBuilder.whereNotIn(column, values);
        return this;
    }

    whereBetween(column: string, min: any, max: any): IDeleteQuery<T> {
        this.queryBuilder.whereBetween(column, min, max);
        return this;
    }

    whereNull(column: string): IDeleteQuery<T> {
        this.queryBuilder.whereNull(column);
        return this;
    }

    whereNotNull(column: string): IDeleteQuery<T> {
        this.queryBuilder.whereNotNull(column);
        return this;
    }

    returning(columns: string | string[]): IDeleteQuery<T> {
        this.queryBuilder.returning(columns);
        return this;
    }

    whereRaw(condition: string, ...values: SqlValue[]): IDeleteQuery<T> {
        this.queryBuilder.whereRaw(condition, ...values);
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
}
