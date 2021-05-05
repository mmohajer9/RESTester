const OASToolkit = require('./RESTester');
const util = require('util');
const { argv, nargs } = require('yargs')
  // metadata
  .scriptName('main.js')
  .usage('Usage: $0 <command> [options]')
  // commands
  .command(
    'generate-raw-odg-config',
    'Creates the Raw Operation Dependency Graph file (odg.json) in the ODGConfig directory'
  )
  .command(
    'generate-test-cases',
    'Generate nominal test cases based on the given ODG JSON Config',
    {
      number: {
        description: 'the number of the test cases that is going to be generated',
        alias: 'n',
      },
      useExample: {
        description: 'use the examples of schema specification',
        alias: 'e',
      },
    }
  )
  .command('print', 'print the Open API Specification which have been validated and parsed')

  // examples
  .example('$0 generate-raw-odg-config')

  // helps
  .help()
  .alias('h', 'help')
  .describe('help', 'Show help.')
  .describe('version', 'Show version number')
  .epilog('Copyright 2021 - RESTester - Mohammad Mahdi Mohajer')
  .demandCommand();

commands = {
  'generate-odg-config': () => {},
  'generate-raw-odg-config': () => {
    const oas = new OASToolkit((oas) => {
      oas.generateRawODGConfig();
    });
  },
  'generate-test-cases': () => {
    const oas = new OASToolkit((oas) => {
      oas.generateTestCases(+argv._[1] , true);
    });
  },
  print: () => {
    const oas = new OASToolkit((oas) => {}, oasConfPath, undefined, {
      resolveHandler: (api) => {
        const inspected = util.inspect(api, false, 2, true);
        console.log(inspected);
      },
      rejectHandler: console.error,
    });
  },
};

command_executor = (commands) => {
  let notFound = true;
  for (const command_name in commands) {
    if (argv._.includes(command_name)) {
      commands[command_name]();
      notFound = false;
    }
  }
  if (notFound) {
    console.log('Invalid command : Try using --help for more information');
  }
};

command_executor(commands);
