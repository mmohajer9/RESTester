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
  .command('init')
  .option(
    '-r, --raw',
    'initialize raw operation dependency graph - will find no dependencies'
  )
  .description(
    'initialize operation dependency graph - will find some dependencies automatically'
  )
  .action((options) => {
    if (options.raw) {
      const restester = new RESTester((instance) => {
        instance.createRawODG();
      });
    } else {
      console.log('init');
    }
  });

program
  .command('generate <number>')
  .option(
    '-u, --use-example',
    'use the examples that is provided in open api specification to generate test cases'
  )
  .description('generate')
  .action((number, options) => {
    console.log('number : ', number);
    console.log('example : ', options.useExample);
  });

program.parse(process.argv);

_.isEmpty(program.args) ? program.help() : null;
