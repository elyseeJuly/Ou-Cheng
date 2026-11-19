/** 「无句读」去掉的句读符号：预览（竖排/横排）与海报共用同一套，保证所见即所得。 */
export const JUDOU_PATTERN = /[，。、；？！,.!?]/g;

export const stripJudou = (line: string): string => line.replace(JUDOU_PATTERN, '');
