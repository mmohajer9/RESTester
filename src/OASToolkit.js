const SwaggerParser = require('@apidevtools/swagger-parser');
const DepGraph = require('dependency-graph').DepGraph;
const pathModule = require('path');
const jf = require('jsonfile');

class OASToolkit {
  constructor(
    mainProgram,
    path = pathModule.join(__dirname, '/OASConfig/openapi.yaml'),
    odgJsonConfigPath = pathModule.join(__dirname, '/ODGConfig/odg.json'),
    config = {
      resolveHandler: undefined,
      rejectHandler: console.error,
    }
  ) {
    // ? initializing fields
    this.path = path;
    this.odgJsonConfigPath = odgJsonConfigPath;
    this.mainProgram = mainProgram;

    // ? initialize resolver/rejecter
    this.resolveHandler = config.resolveHandler;
    this.rejectHandler = config.rejectHandler;

    // ? will be initialize later
    this.parser;
    this.api;
    this.opDepGraph;

    // ? initializer module
    this.#init();
  }

  async generateRawODG(configPath) {
    const file = configPath || this.odgJsonConfigPath;
    const paths = Object.keys(this.api.paths);
    const configs = paths.map((item) => {
      return {
        endpoint: item,
        dependsOn: [],
        derivedProps: {},
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
