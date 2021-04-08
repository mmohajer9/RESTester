const SwaggerParser = require('@apidevtools/swagger-parser');
const DepGraph = require('dependency-graph').DepGraph;
const jf = require('jsonfile');

class OASToolkit {
  constructor(
    path,
    mainProgram,
    config = {
      resolveHandler: undefined,
      rejectHandler: console.error,
      odgJsonConfigPath: './odg.json',
    }
  ) {
    // ? initializing fields
    this.path = path;
    this.resolveHandler = config.resolveHandler;
    this.rejectHandler = config.rejectHandler;
    this.odgJsonConfigPath = config.odgJsonConfigPath;
    this.mainProgram = mainProgram;

    // ? will be initialize later
    this.parser;
    this.api;
    this.opDepGraph;

    // ? initializer module
    this.#init();
  }

  async createRawODG(configPath) {
    const file = configPath || this.odgJsonConfigPath;
    const paths = Object.keys(this.api.paths);
    const configs = paths.map((item, index) => {
      return {
        endpoint: item,
        dependsOn: '',
        sharedProps: {},
      };
    });
    try {
      await jf.writeFile(file, configs, { spaces: 2, EOL: '\r\n' });
    } catch (err) {
      this.rejectHandler(err);
    }
  }

  // ? async methods - initializers

  async #init() {
    await this.#initParser(this.resolveHandler, this.rejectHandler);
    await this.#initODG(this.resolveHandler, this.rejectHandler);
    // ? user main callback
    this.mainProgram ? this.mainProgram(this) : null;
  }

  async #initODG(resolve, reject) {
    this.opDepGraph = new DepGraph();
  }

  async #initParser(resolve, reject) {
    this.parser = new SwaggerParser();
    try {
      this.api = await this.parser.validate(this.path);
      resolve ? resolve(this.api) : null;
    } catch (err) {
      err ? reject(err) : null;
    }
  }
}

module.exports = OASToolkit;
