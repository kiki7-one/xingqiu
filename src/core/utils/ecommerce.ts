/**
 * 电商跳转工具
 * 联网时打开电商平台搜索，离线时返回 null（由调用方置灰）
 */

export type EcommercePlatform = "taobao" | "jd" | "pinduoduo";

export const ECOMMERCE_LABEL: Record<EcommercePlatform, string> = {
  taobao: "淘宝",
  jd: "京东",
  pinduoduo: "拼多多",
};

/**
 * 生成电商搜索 URL
 */
export function buildSearchUrl(
  platform: EcommercePlatform,
  keyword: string
): string {
  const encoded = encodeURIComponent(keyword);
  switch (platform) {
    case "taobao":
      return `https://s.taobao.com/search?q=${encoded}`;
    case "jd":
      return `https://search.jd.com/Search?keyword=${encoded}`;
    case "pinduoduo":
      return `https://mobile.yangkeduo.com/proxy/api/search?q=${encoded}`;
  }
}

/**
 * 检测是否联网
 * 浏览器环境用 navigator.onLine
 */
export function isOnline(): boolean {
  if (typeof navigator !== "undefined" && typeof navigator.onLine === "boolean") {
    return navigator.onLine;
  }
  // Node/非浏览器环境默认视为离线
  return false;
}

/**
 * 跳转到电商搜索
 * @returns true 跳转成功，false 离线不可跳转
 */
export function jumpToEcommerce(
  platform: EcommercePlatform,
  keyword: string
): boolean {
  if (!isOnline()) return false;
  const url = buildSearchUrl(platform, keyword);
  if (typeof window !== "undefined" && typeof window.open === "function") {
    window.open(url, "_blank", "noopener,noreferrer");
    return true;
  }
  return false;
}
