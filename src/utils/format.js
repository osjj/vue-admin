/**
 * 格式化日期时间
 * @param {string|Date} datetime - 日期时间字符串或Date对象
 * @param {string} format - 格式化模式，默认为 'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的日期时间字符串
 */
export function formatDateTime(datetime, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!datetime) return '';
  
  const date = typeof datetime === 'string' ? new Date(datetime) : datetime;
  
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 格式化金额
 * @param {number} amount - 金额数值
 * @param {number} decimals - 小数位数，默认为2
 * @param {string} currency - 货币符号，默认为'¥'
 * @returns {string} 格式化后的金额字符串
 */
export function formatCurrency(amount, decimals = 2, currency = '¥') {
  if (amount === null || amount === undefined) return '';
  
  const formattedAmount = Number(amount).toFixed(decimals);
  return `${currency}${formattedAmount}`;
}

/**
 * 格式化数量（添加千位分隔符）
 * @param {number} num - 数值
 * @returns {string} 格式化后的数值字符串
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return '';
  
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 截断文本并添加省略号
 * @param {string} text - 原始文本
 * @param {number} length - 最大长度
 * @returns {string} 截断后的文本
 */
export function truncateText(text, length = 50) {
  if (!text) return '';
  
  if (text.length <= length) return text;
  
  return text.substring(0, length) + '...';
}
