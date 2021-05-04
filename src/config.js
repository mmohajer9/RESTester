const path = require('path');

const configuration = {
  // general directories
  testsDir: path.resolve('out', '__tests__'),
  logsDir: path.resolve('out', 'logs'),
  oasConfDir: path.resolve('src', 'OASConfig'),
  odgConfDir: path.resolve('src', 'ODGConfig'),
  // api under test directories
  apiTestsDir: (apiName) => path.resolve('out', '__tests__', apiName),
  apiCommonDir: (apiName) => path.resolve('out', '__tests__', apiName, 'common'),
  apiTemplatesDir: (apiName) => path.resolve('out', '__tests__', apiName, 'templates'),
  apiErrorTestCasesDir: (apiName) => path.resolve('out', '__tests__', apiName, 'erros'),
  apiNominalTestCasesDir: (apiName) => path.resolve('out', '__tests__', apiName, 'nominals'),
};

module.exports = configuration;
