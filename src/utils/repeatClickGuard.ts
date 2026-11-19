/**
 * 连击守卫：区分「单击切换」与「双击 / 快速连点」的第二下。
 *
 * 词条按钮是开合切换（点开详情、再点收起）。双击会派发两次 click：第一下展开、
 * 第二下又收起，用户看到的就是「双击打不开」。触屏上双击缩放与快速连点同理。
 * 这里把第二下识别出来，让调用方保持展开而不是收起。
 *
 * - 桌面：MouseEvent.detail > 1 即为同一次双击里的后续 click。
 * - 触屏 / 不带 detail 的环境：同一个键在 windowMs 内再次点击也视为连击。
 */
export function createRepeatClickGuard(windowMs = 400, now: () => number = () => Date.now()) {
  let lastKey: string | null = null;
  let lastAt = -Infinity;
  return (key: string, event?: { detail?: number } | null): boolean => {
    const t = now();
    const repeat = (event?.detail ?? 0) > 1 || (lastKey === key && t - lastAt < windowMs);
    lastKey = key;
    lastAt = t;
    return repeat;
  };
}
