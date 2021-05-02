const SwaggerParser = require('@apidevtools/swagger-parser');
const DepGraph = require('dependency-graph').DepGraph;
const pathModule = require('path');
const jf = require('jsonfile');
const _ = require('lodash');
const ejs = require('ejs');
const fse = require('fs-extra');

class BaseInitializer {
  constructor(
    // primary parameters
    mainProgram,
    oasConfPath = pathModule.join(__dirname, '/OASConfig/openapi.yaml'),
    odgConfPath = pathModule.join(__dirname, '/ODGConfig/odg.json'),
    config = {
      resolveHandler: undefined,
      rejectHandler: console.error,
    }
  ) {
    // initializing fields
    this.oasConfPath = oasConfPath;
    this.odgConfPath = odgConfPath;
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
      resolve ? resolve(this.api) : null;
    } catch (err) {
      err ? reject(err) : null;
    }
  }
}

class ODGInitializer extends BaseInitializer {
  constructor(...props) {
    super(...props);

    // initialize a operation dependency graph (empty)
    this.graph = new DepGraph();
    // calculate api call order based on dependencies in odg.json
    this.setApiCallOrder();
  }

  // TODO Generate ODG config automatically based on similarity measures
  async generateODGConfig(configPath) {}

  // TODO Generate raw ODG config which has no selected dependencies
  async generateRawODGConfig(configPath) {
    const file = configPath || this.odgConfPath;
    const configs = [];

    for (const item in this.api.paths) {
      configs.push({
        endpoint: item,
        dependsOn: [],
        derivedProps: {
          head: this.getMethodProps(item, 'head'),
          post: this.getMethodProps(item, 'post'),
          get: this.getMethodProps(item, 'get'),
          put: this.getMethodProps(item, 'put'),
          patch: this.getMethodProps(item, 'patch'),
          delete: this.getMethodProps(item, 'delete'),
        },
      });
    }

    try {
      await jf.writeFile(file, configs, { spaces: 2, EOL: '\r\n' });
    } catch (err) {
      this.rejectHandler(err);
    }
  }

  // set api call order based on dependecies in odg.json
  setApiCallOrder() {
    // ? first we justify how to call the api in the correct order
    const odgConfig = require(this.odgConfPath);
    odgConfig.forEach((element) => {
      this.graph.addNode(element.endpoint, element.derivedProps);
    });
    odgConfig.forEach((element) => {
      if (!_.isEmpty(element.dependsOn)) {
        element.dependsOn.forEach((dependencyEndpoint) => {
          this.graph.addDependency(element.endpoint, dependencyEndpoint);
        });
      }
    });
    this.apiCallOrder = this.graph.overallOrder();
    this.odgConfig = odgConfig;
  }
}

class RESTester extends ODGInitializer {
  constructor(...props) {
    super(...props);
    this.httpMethodOrder = ['head', 'post', 'get', 'put', 'patch', 'delete'];
  }

  generateTestCases() {
    // nominalTestCases
    // errorTestCases
  }

  generateNominalTestCases() {}

  generateErrorTestCases() {}


}

module.exports = RESTester;
