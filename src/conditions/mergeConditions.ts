import cloneDeep from 'lodash.clonedeep';
import { ICondition, IStandardCondition } from '../core';

function isStandard(c: ICondition): c is IStandardCondition {
    return c !== null && typeof c === 'object' && !Array.isArray(c) && typeof (c as any).Fn === 'string';
}

function toArray(args: any): any[] {
    if (Array.isArray(args)) return args;
    return [args];
}

/**
 * Merges two conditions into a single logically correct condition.
 *
 * Leaf — a terminal condition (EQUALS, NOT_EQUALS, NOT, STARTS_WITH,
 *         LIST_CONTAINS, TRUE, custom:*).
 *         Not an aggregator; cannot be flattened into another condition's args.
 *
 * Merge rules:
 *
 *   condition \ newCondition  |  AND                      |  OR                |  leaf
 *   --------------------------|---------------------------|--------------------|---------------------------
 *   AND                       |  AND (flatten both args)  |  AND([AND, OR])    |  AND (append leaf to args)
 *   OR                        |  AND([OR, AND])           |  OR (flatten both) |  AND([OR, leaf])
 *   leaf                      |  AND (prepend to args)    |  AND([leaf, OR])   |  AND([leaf1, leaf2])
 *
 * Why AND+OR / OR+AND cannot be flattened:
 *   condition    = AND([A, B]) → A AND B
 *   newCondition = OR([C, D])  → C OR D
 *   Flattening would give AND([A, B, C, D]) — ALL four must be true,
 *   which breaks OR semantics. Correct: AND([AND([A,B]), OR([C,D])]).
 *
 * Additional rules:
 *   - null/undefined operand → returns the other (cloned)
 *   - inputs are never mutated (deep-cloned before processing)
 */
export function mergeConditions(condition: ICondition, newCondition: ICondition): ICondition {
    if (condition == null && newCondition == null) return null;
    if (condition == null) return cloneDeep(newCondition as any);
    if (newCondition == null) return cloneDeep(condition as any);

    const c = cloneDeep(condition as any) as ICondition;
    const n = cloneDeep(newCondition as any) as ICondition;

    const cIsAnd = isStandard(c) && (c as IStandardCondition).Fn === 'AND';
    const nIsAnd = isStandard(n) && (n as IStandardCondition).Fn === 'AND';
    const cIsOr  = isStandard(c) && (c as IStandardCondition).Fn === 'OR';
    const nIsOr  = isStandard(n) && (n as IStandardCondition).Fn === 'OR';

    if (cIsAnd && nIsAnd) {
        return {
            Fn: 'AND',
            args: [
                ...toArray((c as IStandardCondition).args),
                ...toArray((n as IStandardCondition).args),
            ],
        };
    }

    if (cIsOr && nIsOr) {
        return {
            Fn: 'OR',
            args: [
                ...toArray((c as IStandardCondition).args),
                ...toArray((n as IStandardCondition).args),
            ],
        };
    }

    if (cIsAnd && !nIsAnd && !nIsOr) {
        return {
            Fn: 'AND',
            args: [...toArray((c as IStandardCondition).args), n],
        };
    }

    if (!cIsAnd && !cIsOr && nIsAnd) {
        return {
            Fn: 'AND',
            args: [c, ...toArray((n as IStandardCondition).args)],
        };
    }

    return {
        Fn: 'AND',
        args: [c, n],
    };
}
