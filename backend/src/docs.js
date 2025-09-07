const path = require('path');
const swaggerUi = require('swagger-ui-express');
const spec = require('../docs/openapi.json');

function mountDocs(app) {
  app.get('/api/docs.json', (_req, res) => res.json(spec));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec, { explorer: true }));
}

module.exports = { mountDocs };
