import { IQueryExecutor } from '../abstractions';
import { QueryParameters, WhereCondition } from '../../types/core';

export class UpdateQueryBuilder {
    private tableName: string = '';
    private setValues: Record<string, any> = {};
    private whereConditions: WhereCondition[] = [];
    private returningColumns: string[] = [];

    constructor(private queryExecutor: IQueryExecutor) {}

    table(tableName: string): this {
        this.tableName = tableName;
        return this;
    }

    set(column: string, value: any): this;
    set(values: Record<string, any>): this;
    set(columnOrValues: string | Record<string, any>, value?: any): this {
        if (typeof columnOrValues === 'string') {
            this.setValues[columnOrValues] = value;
        } else {
            this.setValues = { ...this.setValues, ...columnOrValues };
        }
        return this;
    }

    where(column: string, operator: string, value: any): this;
    where(column: string, value: any): this;
    where(condition: string): this;
    where(columnOrCondition: string, operatorOrValue?: any, value?: any): this {
        if (arguments.length === 1) {
            // Raw condition
            this.whereConditions.push({
                type: 'raw',
                condition: columnOrCondition,
                operator: 'raw',
                column: '',
                value: undefined
            });
        } else if (arguments.length === 2) {
            // column = value
            this.whereConditions.push({
                type: 'simple',
                column: columnOrCondition,
                operator: '=',
                value: operatorOrValue
            });
        } else {
            // column operator value
            this.whereConditions.push({
                type: 'simple',
                column: columnOrCondition,
                operator: operatorOrValue,
                value: value
            });
        }
        return this;
    }

    whereIn(column: string, values: any[]): this {
        this.whereConditions.push({
            type: 'in',
            column,
            operator: 'IN',
            value: values
        });
        return this;
    }

    whereNotIn(column: string, values: any[]): this {
        this.whereConditions.push({
            type: 'in',
            column,
            operator: 'NOT IN',
            value: values
        });
        return this;
    }

    whereBetween(column: string, min: any, max: any): this {
        this.whereConditions.push({
            type: 'between',
            column,
            operator: 'BETWEEN',
            value: [min, max]
        });
        return this;
    }

    whereNull(column: string): this {
        this.whereConditions.push({
            type: 'null',
            column,
            operator: 'IS NULL',
            value: null
        });
        return this;
    }

    whereNotNull(column: string): this {
        this.whereConditions.push({
            type: 'null',
            column,
            operator: 'IS NOT NULL',
            value: null
        });
        return this;
    }

    whereRaw(condition: string, ...values: any[]): this {
        this.whereConditions.push({
            type: 'raw',
            condition: condition,
            operator: 'raw',
            column: '',
            value: values
        });
        return this;
    }

    returning(columns: string | string[]): this {
        this.returningColumns = Array.isArray(columns) ? columns : [columns];
        return this;
    }

    build(): { sql: string; parameters: QueryParameters } {
        if (!this.tableName) {
            throw new Error('Table name is required for UPDATE query');
        }

        if (Object.keys(this.setValues).length === 0) {
            throw new Error('No values to update');
        }

        if (this.whereConditions.length === 0) {
            throw new Error('WHERE clause is required for UPDATE query for safety');
        }

        const parameters: QueryParameters = {};
        let paramIndex = 0;

        // Build SET clause
        const setClause = Object.keys(this.setValues).map(column => {
            const paramName = `param${paramIndex++}`;
            parameters[paramName] = this.setValues[column];
            return `${column} = @${paramName}`;
        }).join(', ');

        // Build WHERE clause
        const whereClause = this.buildWhereClause(parameters, paramIndex);

        let sql = `UPDATE ${this.tableName} SET ${setClause} WHERE ${whereClause.clause}`;

        if (this.returningColumns.length > 0) {
            sql += ` OUTPUT ${this.returningColumns.map(col => `INSERTED.${col}`).join(', ')}`;
        }

        return { sql, parameters: { ...parameters, ...whereClause.parameters } };
    }

    private buildWhereClause(parameters: QueryParameters, startIndex: number): { clause: string; parameters: QueryParameters } {
        const whereParams: QueryParameters = {};
        let paramIndex = startIndex;
        
        const conditions = this.whereConditions.map(condition => {
            switch (condition.type) {
                case 'raw':
                    return condition.condition;
                
                case 'simple':
                    const paramName = `param${paramIndex++}`;
                    whereParams[paramName] = condition.value;
                    return `${condition.column} ${condition.operator} @${paramName}`;
                
                case 'in':
                    const inParams = (condition.value as any[]).map(val => {
                        const paramName = `param${paramIndex++}`;
                        whereParams[paramName] = val;
                        return `@${paramName}`;
                    });
                    return `${condition.column} ${condition.operator} (${inParams.join(', ')})`;
                
                case 'between':
                    const [min, max] = condition.value as [any, any];
                    const minParam = `param${paramIndex++}`;
                    const maxParam = `param${paramIndex++}`;
                    whereParams[minParam] = min;
                    whereParams[maxParam] = max;
                    return `${condition.column} BETWEEN @${minParam} AND @${maxParam}`;
                
                case 'null':
                    return `${condition.column} ${condition.operator}`;
                
                default:
                    throw new Error(`Unknown condition type: ${(condition as any).type}`);
            }
        });

        return {
            clause: conditions.join(' AND '),
            parameters: whereParams
        };
    }    async execute<T = any>(): Promise<T[]> {
        const { sql, parameters } = this.build();
        return await this.queryExecutor.execute<T>(sql, parameters);
    }
}
