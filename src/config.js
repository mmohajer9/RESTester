const path = require('path');

const configuration = {
  // handlers
  resolveHandler: console.log,
  rejectHandler: console.error,
  logHandler : console.log,

  // general directories
  testsDir: path.resolve('out', '__tests__'),
  logsDir: path.resolve('out', 'logs'),
  oasConfDir: path.resolve('src', 'OASConfig'),
  odgConfDir: path.resolve('src', 'ODGConfig'),

  // general default paths
  oasConfPath: path.resolve('src', 'OASConfig', 'openapi.json'),
  odgConfPath: path.resolve('src', 'ODGConfig', 'odg.json'),

  // custom paths for config files
  customOasConfPath: (name) => path.resolve('src', 'OASConfig', name),
  customOdgConfPath: (name) => path.resolve('src', 'ODGConfig', name),

  // test directories
  apiTestsDir: (apiName) => path.resolve('out', '__tests__', apiName),
  apiCommonDir: (apiName) => path.resolve('out', '__tests__', apiName, 'common'),
  apiTemplatesDir: (apiName) => path.resolve('out', '__tests__', apiName, 'templates'),
  apiErrorTestCasesDir: (apiName) => path.resolve('out', '__tests__', apiName, 'erros'),
  apiNominalTestCasesDir: (apiName) => path.resolve('out', '__tests__', apiName, 'nominals'),

  // test file paths
  apiResponseDictionaryPath: (apiName) =>
    path.resolve('out', '__tests__', apiName, 'common', 'responseDictionary.json'),
};

module.exports = configuration;
