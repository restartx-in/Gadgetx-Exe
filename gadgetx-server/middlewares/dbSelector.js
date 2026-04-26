const { getPool } = require('../config/db');

function dbSelector(appName) {
  return (req, res, next) => {
    try {
      const dbPool = getPool(appName);
      
      req.db = dbPool;
      
      req.appName = appName;
      
      next();
    } catch (error) {
      console.error(`Database selection error for ${appName}:`, error);
      return res.status(500).json({
        error: `Database configuration error: ${error.message}`
      });
    }
  };
}

module.exports = dbSelector;
