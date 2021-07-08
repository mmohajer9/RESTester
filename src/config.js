const path = require('path');

const configuration = {
  // handlers
  resolveHandler: console.log,
  rejectHandler: console.error,
  logHandler: console.log,

  // general directories
  testsDir: path.resolve('out', 'tests'),
  oasConfDir: path.resolve('src', 'OASConfig'),
  odgConfDir: path.resolve('src', 'ODGConfig'),

  // general default paths
  oasConfPath: path.resolve('src', 'OASConfig', 'openapi.json'),
  odgConfPath: path.resolve('src', 'ODGConfig', 'odg.json'),

  // custom paths for config files
  customOasConfPath: (name) => path.resolve('src', 'OASConfig', name),
  customOdgConfPath: (name) => path.resolve('src', 'ODGConfig', name),

  // test directories
  apiTestsDir: (apiName) => path.resolve('out', 'tests', apiName),
  logsDir: (apiName) => path.resolve('out', 'tests', apiName, 'logs'),
  apiCommonDir: (apiName) => path.resolve('out', 'tests', apiName, 'common'),
  apiTemplatesDir: (apiName) =>
    path.resolve('out', 'tests', apiName, 'templates'),
  apiErrorTestCasesDir: (apiName) =>
    path.resolve('out', 'tests', apiName, 'errors'),
  apiNominalTestCasesDir: (apiName) =>
    path.resolve('out', 'tests', apiName, 'nominals'),

  apiNominalJsonTestCasesDir: (apiName) =>
    path.resolve('out', 'tests', apiName, 'nominals', 'json'),
  apiNominalJestTestCasesDir: (apiName) =>
    path.resolve('out', 'tests', apiName, 'nominals', 'jest'),
  apiNominalJsTestCasesDir: (apiName) =>
    path.resolve('out', 'tests', apiName, 'nominals', 'js'),
  apiErrorJsonTestCasesDir: (apiName) =>
    path.resolve('out', 'tests', apiName, 'errors', 'json'),
  apiErrorJestTestCasesDir: (apiName) =>
    path.resolve('out', 'tests', apiName, 'errors', 'jest'),
  apiErrorJsTestCasesDir: (apiName) =>
    path.resolve('out', 'tests', apiName, 'errors', 'js'),

  // test file paths
  apiTempatePath: (apiName, templateName) =>
    path.resolve('out', 'tests', apiName, 'templates', templateName, '.ejs'),
  apiResponseDictionaryPath: (apiName) =>
    path.resolve('out', 'tests', apiName, 'common', 'rd.json'),

  // utilites
  jestTestCasesDir: () => path.resolve('__tests__'),
};

module.exports = configuration;
