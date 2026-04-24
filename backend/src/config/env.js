const getEnv = () => ({
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8000'
});

module.exports = { getEnv };
