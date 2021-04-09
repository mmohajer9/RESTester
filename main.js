#!/usr/bin/env node
const OASToolkit = require('./src/OASToolkit');
const util = require('util');
const { argv, nargs } = require('yargs')
  .scriptName('main.js')
  .usage('Usage: $0 <command> [options]')
  .command(
    'generate-raw-odg-config',
    'Creates the Raw Operation Dependency Graph file (odg.json) in the ODGConfig directory',
    {
      file: {
        description:
          'the path of the specific file to save the ODG File into it',
        alias: 'f',
      },
      source: {
        description: 'the path of the specific OAS source file : JSON or YAML',
        alias: 's',
      },
    }
  )
  .command(
    'generate-test-cases',
    'Generate nominal test cases for the given ODG JSON Config',
    {
      file: {
        description:
          'the path of the specific file to save the ODG File into it',
        alias: 'f',
      },
      source: {
        description: 'the path of the specific OAS source file : JSON or YAML',
        alias: 's',
      },
    }
  )
  .command(
    'print',
    'print the Open API Specification which have been validated and parsed',
    {
      source: {
        description: 'the path of the specific OAS source file : JSON or YAML',
        alias: 's',
      },
    }
  )
  .example('$0 generate-raw-odg-config')
  .example('$0 generate-raw-odg-config -s myOAS.yaml')
  .example('$0 generate-raw-odg-config -f myODG.json')
  .example('$0 generate-raw-odg-config -s myOAS.yaml -f myODG.json')

  .help()
  .alias('h', 'help')
  .describe('help', 'Show help.')
  .describe('version', 'Show version number')
  .epilog('Copyright 2021 - OASToolkit/RESTester - Mohammad Mahdi Mohajer')
  .demandCommand();

if (argv._.includes('generate-raw-odg')) {
  const openApiSpecPath = argv.source ? argv.source : undefined;
  const odgJsonConfigPath = argv.file ? argv.file : undefined;

  const oas = new OASToolkit(
    (oas) => {
      oas.generateRawODGConfig();
    },
    openApiSpecPath,
    odgJsonConfigPath
  );
} else if (argv._.includes('print')) {
  const openApiSpecPath = argv.source ? argv.source : undefined;

  const oas = new OASToolkit((oas) => {}, openApiSpecPath, undefined, {
    resolveHandler: (api) => {
      console.log(util.inspect(api, false, null, true));
    },
    rejectHandler: console.error,
  });
} else if (argv._.includes('generate-test-cases')) {
  const openApiSpecPath = argv.source ? argv.source : undefined;
  const odgJsonConfigPath = argv.file ? argv.file : undefined;

  const oas = new OASToolkit(
    (oas) => {
      oas.generateTestCases(1);
    },
    openApiSpecPath,
    odgJsonConfigPath
  );
}
