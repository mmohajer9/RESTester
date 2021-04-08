#!/usr/bin/env node
const OASToolkit = require('./src/OASToolkit');
const { argv, nargs } = require('yargs')
  .scriptName('main.js')
  .usage('Usage: $0 <command> [options]')
  .command(
    'generate-raw-odg',
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
  .example('$0 generate-raw-odg')
  .example('$0 generate-raw-odg -s myOAS.yaml')
  .example('$0 generate-raw-odg -f myODG.json')
  .example('$0 generate-raw-odg -s myOAS.yaml -f myODG.json')

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
      oas.generateRawODG();
    },
    openApiSpecPath,
    odgJsonConfigPath
  );
}
