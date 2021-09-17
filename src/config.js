const path = require('path');

const configuration = {
  // handlers
  resolveHandler: console.log,
  rejectHandler: console.error,
  logHandler: console.log,

  // general directories
  testsDir: path.resolve(path.resolve(__dirname, '..'), 'out', 'tests'),
  oasConfDir: path.resolve(path.resolve(__dirname, '..'), 'src', 'OASConfig'),
  odgConfDir: path.resolve(path.resolve(__dirname, '..'), 'src', 'ODGConfig'),

  // general default paths
  oasConfPath: path.resolve(
    path.resolve(__dirname, '..'),
    'src',
    'OASConfig',
    'openapi.json'
  ),
  odgConfPath: path.resolve(
    path.resolve(__dirname, '..'),
    'src',
    'ODGConfig',
    'odg.json'
  ),

  // custom paths for config files
  customOasConfPath: (name) =>
    path.resolve(path.resolve(__dirname, '..'), 'src', 'OASConfig', name),
  customOdgConfPath: (name) =>
    path.resolve(path.resolve(__dirname, '..'), 'src', 'ODGConfig', name),

  // test directories
  apiTestsDir: (apiName) =>
    path.resolve(path.resolve(__dirname, '..'), 'out', 'tests', apiName),
  logsDir: (apiName) =>
    path.resolve(
      path.resolve(__dirname, '..'),
      'out',
      'tests',
      apiName,
      'logs'
    ),
  apiCommonDir: (apiName) =>
    path.resolve(
      path.resolve(__dirname, '..'),
      'out',
      'tests',
      apiName,
      'common'
    ),
  apiTemplatesDir: (apiName) =>
    path.resolve(
      path.resolve(__dirname, '..'),
      'out',
      'tests',
      apiName,
      'templates'
    ),
  apiErrorTestCasesDir: (apiName) =>
    path.resolve(
      path.resolve(__dirname, '..'),
      'out',
      'tests',
      apiName,
      'errors'
    ),
  apiNominalTestCasesDir: (apiName) =>
    path.resolve(
      path.resolve(__dirname, '..'),
      'out',
      'tests',
      apiName,
      'nominals'
    ),
  apiPlotDir: (apiName) =>
    path.resolve(
      path.resolve(__dirname, '..'),
      'out',
      'tests',
      apiName,
      'plot'
    ),

  apiNominalJsonTestCasesDir: (apiName) =>
    path.resolve(
      path.resolve(__dirname, '..'),
      'out',
      'tests',
      apiName,
      'nominals',
      'json'
    ),
  apiNominalJestTestCasesDir: (apiName) =>
    path.resolve(
      path.resolve(__dirname, '..'),
      'out',
      'tests',
      apiName,
      'nominals',
      'jest'
    ),
  apiNominalJsTestCasesDir: (apiName) =>
    path.resolve(
      path.resolve(__dirname, '..'),
      'out',
      'tests',
      apiName,
      'nominals',
      'js'
    ),
  apiErrorJsonTestCasesDir: (apiName) =>
    path.resolve(
      path.resolve(__dirname, '..'),
      'out',
      'tests',
      apiName,
      'errors',
      'json'
    ),
  apiErrorJestTestCasesDir: (apiName) =>
    path.resolve(
      path.resolve(__dirname, '..'),
      'out',
      'tests',
      apiName,
      'errors',
      'jest'
    ),
  apiErrorJsTestCasesDir: (apiName) =>
    path.resolve(
      path.resolve(__dirname, '..'),
      'out',
      'tests',
      apiName,
      'errors',
      'js'
    ),

  // test file paths
  apiTempatePath: (apiName, templateName) =>
    path.resolve(
      path.resolve(__dirname, '..'),
      'out',
      'tests',
      apiName,
      'templates',
      templateName,
      '.ejs'
    ),
  apiResponseDictionaryPath: (apiName) =>
    path.resolve(
      path.resolve(__dirname, '..'),
      'out',
      'tests',
      apiName,
      'common',
      'rd.json'
    ),

  // utilites
  jestTestCasesDir: () =>
    path.resolve(path.resolve(__dirname, '..'), '__tests__'),
};

module.exports = configuration;
