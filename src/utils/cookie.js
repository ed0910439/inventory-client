// utils/cookie.js

/**
 * 設定 cookie
 * @param {string} name - cookie 的名稱
 * @param {string} value - cookie 的值
 * @param {number} days - cookie 的有效天數 (預設為 365 天)
 */
export const setCookie = (name, value, days = 365) => {
  let expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000)); // 設定 cookie 的到期時間
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/`; // 設定 cookie
};

/**
 * 取得 cookie 的值
 * @param {string} name - cookie 的名稱
 * @returns {string | null} - cookie 的值，如果 cookie 不存在則返回 null
 */
export const getCookie = (name) => {
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length); // 去除開頭的空格
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length); // 找到 cookie，返回其值
  }
  return null; // cookie 不存在
};
