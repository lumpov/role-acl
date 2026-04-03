import { IConditionFunction } from './IConditionFunction';
import { AccessControlError } from '../core';
import { toComparable } from './compareUtil';

/**
 * ISTODAY condition
 *
 * Проверяет, что значение указанных полей относится к сегодняшнему дню.
 * Требует наличия в контексте context.date.todayStart и context.date.tomorrowStart.
 *
 * args — массив имён полей контекста:
 *   { Fn: 'ISTODAY', args: ['data_vremya_servera'] }
 *
 * Возвращает true если для всех перечисленных полей выполняется:
 *   todayStart <= fieldValue < tomorrowStart
 */
export class ISTODAYCondition implements IConditionFunction {
    evaluate(args?: any, context?: any) {
        if (!args) {
            return true;
        }

        if (!context) {
            return false;
        }

        if (!Array.isArray(args)) {
            throw new AccessControlError('ISTODAYCondition expects type of args to be array');
        }

        const todayStart    = context?.date?.todayStart;
        const tomorrowStart = context?.date?.tomorrowStart;

        if (!todayStart || !tomorrowStart) {
            throw new AccessControlError(
                'ISTODAYCondition requires context.date.todayStart and context.date.tomorrowStart'
            );
        }

        const todayTs    = toComparable(todayStart);
        const tomorrowTs = toComparable(tomorrowStart);

        return args.every((fieldName: string) => {
            const fieldValue = context[fieldName];
            const fieldTs    = toComparable(fieldValue);
            if (fieldTs === null || todayTs === null || tomorrowTs === null) {
                return false;
            }
            return fieldTs >= todayTs && fieldTs < tomorrowTs;
        });
    }
}
