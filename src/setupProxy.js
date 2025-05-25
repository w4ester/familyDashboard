const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy for MCP server
  app.use(
    '/api/mcp',
    createProxyMiddleware({
      target: 'http://localhost:3030',
      changeOrigin: true,
      pathRewrite: {
        '^/api/mcp': ''
      }
    })
  );

  // Proxy for Tools API server
  app.use(
    '/api/tools',
    createProxyMiddleware({
      target: 'http://localhost:3031',
      changeOrigin: true
    })
  );

  // Proxy for OpenAPI server (for later)
  app.use(
    '/api/openapi',
    createProxyMiddleware({
      target: 'http://localhost:8080',
      changeOrigin: true,
      pathRewrite: {
        '^/api/openapi': '/api'
      }
    })
  );
};