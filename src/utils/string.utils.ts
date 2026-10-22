const UID_REGEX = new RegExp(`^1?[1,2,3,5,6,7,8,9][0-9]{8}$`);
const STAGE_ID_REGEX = new RegExp(`^[0-9]{10}$`);

export function isUid(value: string) {
    return UID_REGEX.test(value);
}

export function isStageId(value: string) {
    return STAGE_ID_REGEX.test(value);
}