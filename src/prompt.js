const OASToolkit = require('./RESTester');
const util = require('util');
const { argv, nargs } = require('yargs')
  // metadata
  .scriptName('main.js')
  .usage('Usage: $0 <command> [options]')
  // commands
  .command(
    'generate-raw-odg-config',
    'Creates the Raw Operation Dependency Graph file (odg.json) in the ODGConfig directory',
    {
      file: {
        description: 'the path of the specific file to save the ODG File into it',
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
    'Generate nominal test cases based on the given ODG JSON Config',
    {
      file: {
        description: 'the path of the specific file to save the ODG File into it',
        alias: 'f',
      },
      source: {
        description: 'the path of the specific OAS source file : JSON or YAML',
        alias: 's',
      },
    }
  )
  .command('print', 'print the Open API Specification which have been validated and parsed', {
    source: {
      description: 'the path of the specific OAS source file : JSON or YAML',
      alias: 's',
    },
  })
  // examples
  .example('$0 generate-raw-odg-config')
  .example('$0 generate-raw-odg-config -s myOAS.yaml')
  .example('$0 generate-raw-odg-config -f myODG.json')
  .example('$0 generate-raw-odg-config -s myOAS.yaml -f myODG.json')
  // helps
  .help()
  .alias('h', 'help')
  .describe('help', 'Show help.')
  .describe('version', 'Show version number')
  .epilog('Copyright 2021 - RESTester - Mohammad Mahdi Mohajer')
  .demandCommand();

const oasConfPath = argv.source ? argv.source : undefined;
const odgConfPath = argv.file ? argv.file : undefined;

commands = {
  'generate-odg-config': () => {},
  'generate-raw-odg-config': () => {
    const oas = new OASToolkit(
      (oas) => {
        oas.generateRawODGConfig();
      },
      oasConfPath,
      odgConfPath
    );
  },
  'generate-test-cases': () => {
    const oas = new OASToolkit(
      (oas) => {
        oas.generateTestCases();
      },
      oasConfPath,
      odgConfPath
    );
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
