#!/usr/bin/env node
const OASToolkit = require('./src/OASToolkit');
const pathModule = require('path');
const { argv } = require('yargs')
  .scriptName('main.js')
  .usage('Usage: $0 <command> [options]')
  .command(
    'create-odg',
    'Creates the Operation Dependency Graph file (odg.json) in the ODGConfig directory',
    {
      file: {
        description:
          'the path of the specific file to save the ODG File into it',
        alias: 'f',
      },
    }
  )
  .example('$0 create-odg')
  .example('$0 create-odg -f myODG.json')

  .help()
  .alias('h', 'help')
  .describe('help', 'Show help.')
  .describe('version', 'Show version number')
  .epilog('Copyright 2021 - OASToolkit/RESTester - Mohammad Mahdi Mohajer')
  .demandCommand();

if (argv._.includes('create-odg')) {
  const defaultPath = pathModule.join(__dirname, '/src/OASConfig/openapi.yaml');
  const openApiSpec = argv.file ? argv.file : defaultPath;

  const oas = new OASToolkit(openApiSpec, (oas) => {
    oas.createRawODG();
  });
}
