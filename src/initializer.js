const SwaggerParser = require('@apidevtools/swagger-parser');

class BaseInitializer {
  constructor(mainProgram) {
    // initializing fields
    this.oasConfPath = config.oasConfPath;
    this.odgConfPath = config.odgConfPath;
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

    // initializing parser and validator
    this.#init();
  }

  async #init() {
    await this.#initParser(this.resolveHandler, this.rejectHandler);
    // call main callback
    this.mainProgram ? this.mainProgram(this) : null;
  }

  async #initParser(resolve, reject) {
    this.parser = new SwaggerParser();
    try {
      this.api = await this.parser.validate(this.oasConfPath);
    } catch (err) {
      err ? reject(err) : null;
    }
  }
}

module.exports = BaseInitializer;
