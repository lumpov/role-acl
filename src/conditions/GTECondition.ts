import { CommonUtil } from '../utils/common';
import { IConditionFunction } from './IConditionFunction';
import { AccessControlError } from '../core';
import { ConditionUtil } from './util';
import { compareGE } from './compareUtil';

export class GTECondition implements IConditionFunction {
    evaluate(args?: any, context?: any) {
        if (!args) {
            return true;
        }
        if (!context) {
            return false;
        }
        if (CommonUtil.type(args) !== 'object') {
            throw new AccessControlError('GTECondition expects type of args to be object');
        }
        return Object.keys(args).every((key) => {
            const keyValue = key.startsWith('$.') ? ConditionUtil.getValueByPath(context, key) : context[key];
            const argValue = ConditionUtil.getValueByPath(context, args[key]);
            return compareGE(keyValue, argValue);
        });
    }
}
