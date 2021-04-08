const argv = process.argv.splice(2);
const OASToolkit = require('./src/OASToolkit');

const openApiSpec = argv[0];

const oas = new OASToolkit(openApiSpec, (oas) => {
  oas.createRawODG();
});
