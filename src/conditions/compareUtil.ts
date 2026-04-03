import moment from 'moment';

/**
 * Форматы дат, которые Sequelize возвращает через typeCast field.string()
 * для DATETIME-полей MySQL (timezone: '+00:00', строки без суффикса — UTC).
 */
const DATETIME_FORMATS_UTC = [
    'YYYY-MM-DD HH:mm:ss',
    'YYYY-MM-DD HH:mm:ss.SSS',
];

/**
 * Преобразует значение в число для сравнения.
 * Строки в формате DATETIME из Sequelize (без timezone-суффикса) трактуются как UTC,
 * что соответствует настройке dialectOptions.timezone: '+00:00'.
 * Строки с явным timezone-суффиксом (ISO 8601) парсятся с учётом суффикса.
 * Объекты Date конвертируются через getTime().
 */
export function toComparable(value: any): number | string | null {
    if (value === null || value === undefined) {
        return null;
    }

    if (value instanceof Date) {
        return value.getTime();
    }

    if (typeof value === 'string') {
        const mUtc = moment.utc(value, DATETIME_FORMATS_UTC, true);
        if (mUtc.isValid()) {
            return mUtc.valueOf();
        }
        const mIso = moment(value, moment.ISO_8601, true);
        if (mIso.isValid()) {
            return mIso.valueOf();
        }
        return null;
    }

    return value;
}

/**
 * Возвращает true если a > b.
 * Поддерживает числа, строки, Date и DATETIME-строки из Sequelize.
 */
export function compareGT(a: any, b: any): boolean {
    const ca = toComparable(a);
    const cb = toComparable(b);
    if (ca === null || cb === null) return false;
    return ca > cb;
}

/**
 * Возвращает true если a < b.
 */
export function compareLT(a: any, b: any): boolean {
    const ca = toComparable(a);
    const cb = toComparable(b);
    if (ca === null || cb === null) return false;
    return ca < cb;
}

/**
 * Возвращает true если a >= b.
 */
export function compareGE(a: any, b: any): boolean {
    const ca = toComparable(a);
    const cb = toComparable(b);
    if (ca === null || cb === null) return false;
    return ca >= cb;
}

/**
 * Возвращает true если a <= b.
 */
export function compareLE(a: any, b: any): boolean {
    const ca = toComparable(a);
    const cb = toComparable(b);
    if (ca === null || cb === null) return false;
    return ca <= cb;
}
