// commander.js for creating command-line interface
import { Command } from 'commander';
// best utility library
import _ from 'lodash';
// initiating
const program = new Command();
program.version('0.2.0');

program
  .command('print')
  .option('-d, --depth <level>', 'depth of nesting')
  .option(
    '-s, --source <path>',
    'paht to open api specification (swagger) file'
  )
  .description(
    'print the validated and parsed open api specification (swagger)'
  )
  .action((options) => {
    console.log('options --> ', options);
  });

program
  .command('init')
  .option(
    '-r, --raw',
    'initialize raw operation dependency graph - will find no dependencies'
  )
  .option(
    '-s, --source <path>',
    'provide open api specification file with your desired location'
  )
  .option(
    '-o, --output <path>',
    'provide the output path for the generated operation dependency graph json file'
  )
  .description(
    'initialize operation dependency graph - will find some dependencies automatically'
  )
  .action((options) => {
    console.log('options --> ', options);
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
  .option(
    '-s, --source <path>',
    'provide open api specification file with your desired location'
  )
  .option(
    '-g, --graph <path>',
    'provide operation dependency graph configuration file with your desired location'
  )
  .option(
    '-d, --directory <path>',
    'provide the output directory path for the generated test cases json file'
  )
  .description('generate test cases for the target system')
  .action((number, options) => {
    console.log('options --> ', options);
    console.log('number --> ', number);
  });

program
  .command('plot')
  .option(
    '-n, --number <level>',
    'number of cases in the average of last cases'
  )
  .option(
      '-d --directory <path>',
      'directory of generated test cases'
  )
  .description('plot the statistics about the given open api specification')
  .action((options) => {
    console.log('options --> ', options);
  });

// getting cli input to the program
program.parse(process.argv);

// no commands will output the help
_.isEmpty(program.args) ? program.help() : null;
