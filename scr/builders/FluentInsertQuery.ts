import { IInsertQuery } from '../types/fluent-interfaces';
import { IQueryExecutor } from '../core/abstractions';
import { InsertQueryBuilder } from '../core/query/InsertQueryBuilder';

export class FluentInsertQuery<T = any> implements IInsertQuery<T> {
    private queryBuilder: InsertQueryBuilder;

    constructor(queryExecutor: IQueryExecutor) {
        this.queryBuilder = new InsertQueryBuilder(queryExecutor);
    }

    into(table: string): IInsertQuery<T> {
        this.queryBuilder.into(table);
        return this;
    }

    value(column: string, value: any): IInsertQuery<T> {
        this.queryBuilder.value(column, value);
        return this;
    }

    values(data: Record<string, any>): IInsertQuery<T> {
        this.queryBuilder.values(data);
        return this;
    }

    multipleRows(rows: Record<string, any>[]): IInsertQuery<T> {
        this.queryBuilder.multipleRows(rows);
        return this;
    }

    returning(columns: string | string[]): IInsertQuery<T> {
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
}
