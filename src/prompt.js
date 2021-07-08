// initializing command line program
const { Command } = require('commander');
const RESTester = require('./RESTester');
const _ = require('lodash');

const program = new Command();
program.version('0.0.1');

program
  .command('print')
  .option('-d, --depth <level>', 'depth of nesting')
  .description(
    'print the validated and parsed open api specification (swagger)'
  )
  .action((options) => {
    const restester = new RESTester((instance) => {
      instance.print(options.depth);
    });
  });

program
  .command('show')
  .option('-d, --depth <level>', 'depth of nesting')
  .option('-p, --property <name>', 'name of desired property')
  .description('print the actual instance of RESTester')
  .action((options) => {
    if (options.property) {
      const restester = new RESTester((instance) => {
        instance.showProperty(options.property, options.depth);
      });
    } else {
      const restester = new RESTester((instance) => {
        instance.show(options.depth);
      });
    }
  });

program
  .command('init')
  .option(
    '-r, --raw',
    'initialize raw operation dependency graph - will find no dependencies'
  )
  .description(
    'initialize operation dependency graph - will find some dependencies automatically'
  )
  .action((options) => {
    const restester = new RESTester((instance) => {
      instance.createODG(!options.raw);
    });
  });

program
  .command('generate <number>')
  .option(
    '-u, --use-example',
    'use the examples that is provided in open api specification to generate test cases'
  )
  .option('-r, --ratio <number>', 'ratio of using response dictionary')
  .option(
    '-a, --all-methods',
    'use the examples that is provided in open api specification to generate test cases'
  )
  .description('generate')
  .action((number, options) => {
    const restester = new RESTester((instance) => {
      instance.generate(
        number,
        options.ratio,
        options.useExample,
        options.allMethods
      );
    });
  });

program.parse(process.argv);

_.isEmpty(program.args) ? program.help() : null;
