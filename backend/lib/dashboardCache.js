let cache = null;
let cacheTime = 0;
const TTL = 10000; // 10 seconds

const getCachedDashboard = () => {
  const now = Date.now();
  if (cache && (now - cacheTime < TTL)) {
    return cache;
  }
  return null;
};

const setCachedDashboard = (data) => {
  cache = data;
  cacheTime = Date.now();
};

const clearDashboardCache = () => {
  cache = null;
  cacheTime = 0;
};

module.exports = {
  getCachedDashboard,
  setCachedDashboard,
  clearDashboardCache
};
