import { IQueryExecutor } from '../abstractions';
import { QueryParameters } from '../../types/core';

export class InsertQueryBuilder {
    private tableName: string = '';
    private insertValues: Record<string, any> = {};
    private multipleValues: Record<string, any>[] = [];
    private columns: string[] = [];
    private returningColumns: string[] = [];

    constructor(private queryExecutor: IQueryExecutor) {}

    into(table: string): this {
        this.tableName = table;
        return this;
    }    value(column: string, value: any): this {
        this.insertValues[column] = value;
        return this;
    }

    values(data: Record<string, any>): this {
        this.insertValues = { ...this.insertValues, ...data };
        return this;
    }

    multipleRows(rows: Record<string, any>[]): this {
        this.multipleValues = rows;
        return this;
    }

    returning(columns: string | string[]): this {
        this.returningColumns = Array.isArray(columns) ? columns : [columns];
        return this;
    }

    build(): { sql: string; parameters: QueryParameters } {
        if (!this.tableName) {
            throw new Error('Table name is required for INSERT query');
        }

        const parameters: QueryParameters = {};
        let paramIndex = 0;

        if (this.multipleValues.length > 0) {
            return this.buildMultipleInsert(parameters, paramIndex);
        } else {
            return this.buildSingleInsert(parameters, paramIndex);
        }
    }    private buildSingleInsert(parameters: QueryParameters, paramIndex: number): { sql: string; parameters: QueryParameters } {
        if (Object.keys(this.insertValues).length === 0) {
            throw new Error('No values provided for INSERT query');
        }

        const columns = Object.keys(this.insertValues);
        const parameterNames: string[] = [];

        columns.forEach(column => {
            const paramName = `param${paramIndex++}`;
            parameters[paramName] = this.insertValues[column];
            parameterNames.push(`@${paramName}`);
        });

        let sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${parameterNames.join(', ')})`;

        if (this.returningColumns.length > 0) {
            sql += ` OUTPUT ${this.returningColumns.map(col => `INSERTED.${col}`).join(', ')}`;
        }

        return { sql, parameters };
    }

    private buildMultipleInsert(parameters: QueryParameters, paramIndex: number): { sql: string; parameters: QueryParameters } {
        if (this.multipleValues.length === 0) {
            throw new Error('No values provided for multiple INSERT query');
        }

        const firstRow = this.multipleValues[0];
        const columns = Object.keys(firstRow);
        const valuesClauses: string[] = [];

        this.multipleValues.forEach(row => {
            const rowParams: string[] = [];
            columns.forEach(column => {
                const paramName = `param${paramIndex++}`;
                parameters[paramName] = row[column];
                rowParams.push(`@${paramName}`);
            });
            valuesClauses.push(`(${rowParams.join(', ')})`);
        });

        let sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES ${valuesClauses.join(', ')}`;

        if (this.returningColumns.length > 0) {
            sql += ` OUTPUT ${this.returningColumns.map(col => `INSERTED.${col}`).join(', ')}`;
        }

        return { sql, parameters };
    }    async execute<T = any>(): Promise<T[]> {
        const { sql, parameters } = this.build();
        return await this.queryExecutor.execute<T>(sql, parameters);
    }
}
