const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log incoming request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - IP: ${req.ip}`);
  
  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    
    // Log 429 errors specifically
    if (res.statusCode === 429) {
      console.error(`🚨 429 ERROR DETECTED: ${req.method} ${req.url} - IP: ${req.ip}`);
      console.error('Request headers:', req.headers);
      console.error('Response data:', data);
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

module.exports = requestLogger;