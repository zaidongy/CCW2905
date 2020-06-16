import { createHttpEffect } from '@servicenow/ui-effect-http';
import { actionTypes } from '@servicenow/ui-core';

const { COMPONENT_BOOTSTRAPPED } = actionTypes;

import { columns, taskTables, tableLabels } from './defaults.js';

export const actionHandlers = {
    [COMPONENT_BOOTSTRAPPED]: (coeffects) => {
        const { dispatch } = coeffects;

        const query = `sys_class_nameIN${taskTables.join(',')}`;

        const fields = columns.map((col) => {
            return col.field;
        }).join(',');

        dispatch('FETCH_TASK_DATA', {
            sysparm_query: query,
            sysparm_display_value: 'all',
            sysparm_exclude_reference_link: true,
            sysparm_fields: fields,
            sysparm_limit: 10
        });
    },
    'FETCH_TASK_DATA': createHttpEffect('api/now/table/task', {
        method: 'GET',
        queryParams: [
            'sysparm_fields',
            'sysparm_query',
            'sysparm_display_value',
            'sysparm_exclude_reference_link',
            'sysparm_limit'
        ],
        successActionType: 'FETCH_TASK_DATA_SUCCEEDED'
    }),
    'FETCH_TASK_DATA_SUCCEEDED': (coeffects) => {
        const { action, updateState } = coeffects;
        const { result } = action.payload;
        const visualizations = {};

        const dataRows = result.map((row) => {
            const tableName = row.sys_class_name.value;

            if (visualizations[tableName]) {
                visualizations[tableName]++;
            } else {
                visualizations[tableName] = 1;
            }

            return Object.keys(row).reduce((acc, val) => {
                if (val === 'sys_class_name') {
                    acc[val] = row[val].value;
                } else {
                    acc[val] = row[val].display_value;
                }

                return acc;
            }, {});
        });

        updateState({
            dataRows,
            chartData: Object.keys(visualizations).map((table) => {
                return {
                    value: table,
                    label: tableLabels[table],
                    count: visualizations[table]
                }
            })
        })
    },
    'NOW_EXPERIENCE_FILTER#CHANGED': (coeffects) => {
        const { action, dispatch } = coeffects;
        const { payload } = action;

        const query = `sys_class_nameIN${taskTables.join(',')}^${payload.query}`;

        const fields = columns.map((col) => {
            return col.field;
        }).join(',');

        dispatch("FETCH_TASK_DATA", {
            sysparm_query: query,
            sysparm_display_value: 'all',
            sysparm_exclude_reference_link: true,
            sysparm_fields: fields
        });
    },
    'ROW_CLICKED': (coeffects) => {
        const { dispatch, action, updateState } = coeffects;
        const {
            sys_id,
            sys_class_name
        } = action.payload;

        dispatch('FETCH_TASK_RECORD', {
            id: sys_id,
            table: sys_class_name,
            sysparm_display_value: 'all',
            sysparm_exclude_reference_link: true
        });
    },
    'FETCH_TASK_RECORD': createHttpEffect('api/now/table/:table/:id', {
        method: 'GET',
        pathParams: ['table', 'id'],
        queryParams: [
            'sysparm_display_value',
            'sysparm_exclude_reference_link'
        ],
        batch: false,
        successActionType: 'FETCH_TASK_RECORD_SUCCEEDED'
    }),
    'FETCH_TASK_RECORD_SUCCEEDED': (coeffects) => {
        const { action, updateState } = coeffects;
        const { result } = action.payload;

        const items = Object
            .keys(result)
            .sort()
            .reduce((acc, val) => {
                acc.push({
                    label: val,
                    value: {
                        type: 'string',
                        value: result[val].display_value
                    }
                });

                return acc;
            }, []);

        updateState({
            items,
            recordTitle: result.number.display_value,
            recordDetails: result.short_description.display_value
        });
    },
}