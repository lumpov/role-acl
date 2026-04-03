import { IConditionFunction } from './IConditionFunction';
import { AccessControlError } from '../core';
import { ConditionUtil } from './util';
import { toLocalMoment } from './compareUtil';
import moment from 'moment';

/**
 * ISTODAY condition
 *
 * Проверяет, что календарная дата указанных полей совпадает с сегодняшней датой сервера.
 * Сравнение производится по локальной дате (YYYY-MM-DD), без учёта времени и timezone.
 *
 * args — массив путей к полям контекста (поддерживаются $.record.field и обычные имена):
 *   { Fn: 'ISTODAY', args: ['$.record.data_vremya_servera'] }
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

        const today = moment();

        return args.every((fieldPath: string) => {
            const fieldValue = fieldPath.startsWith('$.')
                ? ConditionUtil.getValueByPath(context, fieldPath)
                : context[fieldPath];
            const fieldMoment = toLocalMoment(fieldValue);
            if (fieldMoment === null) {
                return false;
            }
            return fieldMoment.isSame(today, 'day');
        });
    }
}
