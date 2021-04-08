const OASToolkit = require('./src/OASToolkit');
const pathModule = require('path');

const argv = process.argv.splice(2);

const defaultPath = pathModule.join(__dirname, '/src/OASConfig/openapi.yaml');
const openApiSpec = argv[0] || defaultPath;

const oas = new OASToolkit(openApiSpec, (oas) => {
  oas.createRawODG();
});
