/**
 * ID 生成工具
 * 使用 时间戳 + 随机数，纯本地无需 UUID 库
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${timestamp}-${random}`;
}

/**
 * 获取当前 ISO 时间字符串
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * 获取今天日期 YYYY-MM-DD
 */
export function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}
