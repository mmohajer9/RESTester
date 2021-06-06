const SwaggerParser = require('@apidevtools/swagger-parser');
const chalk = require('chalk');
const util = require('util');

class BaseInitializer {
  constructor(mainProgram) {
    // initializing fields
    this.oasConfPath = config.oasConfPath;
    this.odgConfPath = config.odgConfPath;

    // attaching main program
    this.mainProgram = mainProgram;

    // initialize resolver/rejecter
    this.resolveHandler = config.resolveHandler;
    this.rejectHandler = config.rejectHandler;

    // will be initialized later
    this.parser = {};
    this.api = {};
    this.odgConfig = {};
    this.apiCallOrder = [];
    this.httpMethodOrder = [];
    this.graph = {};

    // metadata placeholder
    this.openApiVersion = '';
    this.apiInfo = {};
    this.servers = [];

    // initializing parser and validator
    this.#init();
  }

  async #init() {
    await this.#initParser(this.resolveHandler, this.rejectHandler);
    // fetch metadatas
    this.servers = this.api.servers;
    this.openApiVersion = this.api.openapi;
    this.apiInfo = this.api.info;
    // call main callback
    this.mainProgram ? this.mainProgram(this) : null;
  }

  async #initParser(resolve, reject) {
    this.parser = new SwaggerParser();
    try {
      this.api = await this.parser.validate(this.oasConfPath);
      console.log(
        chalk.green('Open API Specification has been validated and parsed')
      );
    } catch (err) {
      err ? reject(err) : null;
    }
  }

  print(depth) {
    const inspected = util.inspect(this.api, false, depth, true);
    console.log(inspected);
  }
}

module.exports = BaseInitializer;
