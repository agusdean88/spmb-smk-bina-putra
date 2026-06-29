const prisma = require('./prisma');

let cache = null;
let cacheTime = 0;
const TTL = 10 * 60 * 1000; // 10 minutes

const getCachedSettings = async () => {
  const now = Date.now();
  if (cache && (now - cacheTime < TTL)) {
    return cache;
  }
  const settings = await prisma.setting.findMany();
  const settingsMap = settings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});
  cache = settingsMap;
  cacheTime = now;
  return cache;
};

const clearSettingsCache = () => {
  cache = null;
  cacheTime = 0;
};

module.exports = {
  getCachedSettings,
  clearSettingsCache
};
