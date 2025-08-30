// Simple request delay middleware to prevent rate limiting
const requestDelays = new Map();

const rateLimitPrevention = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  // Check if this IP made a request recently
  const lastRequest = requestDelays.get(clientIP);
  
  if (lastRequest) {
    const timeSinceLastRequest = now - lastRequest;
    const minDelay = 100; // 100ms minimum delay between requests
    
    if (timeSinceLastRequest < minDelay) {
      const waitTime = minDelay - timeSinceLastRequest;
      console.log(`Delaying request from ${clientIP} by ${waitTime}ms to prevent rate limiting`);
      
      return setTimeout(() => {
        requestDelays.set(clientIP, now);
        next();
      }, waitTime);
    }
  }
  
  requestDelays.set(clientIP, now);
  
  // Clean up old entries every 10 minutes
  if (Math.random() < 0.01) { // 1% chance to clean up
    const tenMinutesAgo = now - (10 * 60 * 1000);
    for (const [ip, timestamp] of requestDelays.entries()) {
      if (timestamp < tenMinutesAgo) {
        requestDelays.delete(ip);
      }
    }
  }
  
  next();
};

module.exports = rateLimitPrevention;