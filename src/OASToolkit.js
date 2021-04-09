const SwaggerParser = require('@apidevtools/swagger-parser');
const DepGraph = require('dependency-graph').DepGraph;
const pathModule = require('path');
const jf = require('jsonfile');
const _ = require('lodash');
const ejs = require('ejs');
const fse = require('fs-extra');

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
    this.httpMethodOrder = ['head', 'post', 'get', 'put', 'patch', 'delete'];
    this.graph = new DepGraph();

    // ? initialize resolver/rejecter
    this.resolveHandler = config.resolveHandler;
    this.rejectHandler = config.rejectHandler;

    // ? will be initialize later
    this.parser;
    this.api;
    this.odgConfig;
    this.apiCallOrder;

    // ? initializer module
    this.#init();
  }

  generateTestCases(iterationNumber) {
    this.setApiCallOrder();
    for (let index = 0; index < iterationNumber; index++) {
      if (+Math.random().toFixed(3) < 0.2) {
        this.generateErrorTestCases();
      } else {
        this.generateNominalTestCases();
      }
    }
  }

  generateNominalTestCases() {
    const baseURL = this.api.servers[0].url;
    this.apiCallOrder.forEach((item) => {
      for (const method in this.api.paths[item]) {
        ejs.renderFile(
          pathModule.join(
            __dirname,
            '../out/tests/templates/test-case-template.ejs'
          ),
          {
            baseURL,
            method: method,
            path: item,
          },
          (err, str) => {
            if (err) {
              console.error(err);
            } else {
              function makeid(length) {
                var result = [];
                var characters =
                  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                var charactersLength = characters.length;
                for (var i = 0; i < length; i++) {
                  result.push(
                    characters.charAt(
                      Math.floor(Math.random() * charactersLength)
                    )
                  );
                }
                return result.join('');
              }

              const outputFile = pathModule.join(
                process.cwd(),
                `/out/tests/nominals/test-case-${makeid(10)}.js`
              );
              console.log(outputFile)
              fse.ensureFileSync(outputFile);
              fse.outputFileSync(outputFile, str);
              // console.log(str);
            }
          }
        );
      }
    });
  }

  generateErrorTestCases() {}

  setApiCallOrder() {
    // ? first we justify how to call the api in the correct order
    const odgConfig = require(this.odgJsonConfigPath);
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

  statusCodeOracle() {}

  responseValidationOracle() {}

  // * ------------------------------------------------ *

  getJsonRequestBodyProperties(path, method) {
    return this.api.paths[path]?.[method]?.requestBody?.content[
      'application/json'
    ]?.schema?.properties;
  }

  getUrlParams(path, method) {
    const params = this.api.paths[path]?.[method]?.parameters
      ?.filter((param) => param.in === 'path')
      .map((param) => param.name);

    if (_.isEmpty(params)) {
      return null;
    } else {
      const retObj = {};
      params.forEach((element) => {
        retObj[element] = '';
      });
      return retObj;
    }
  }

  getQueryParams(path, method) {
    const params = this.api.paths[path]?.[method]?.parameters
      ?.filter((param) => param.in === 'query')
      .map((param) => param.name);

    if (_.isEmpty(params)) {
      return null;
    } else {
      const retObj = {};
      params.forEach((element) => {
        retObj[element] = '';
      });
      return retObj;
    }
  }

  getHeaderParams(path, method) {
    const params = this.api.paths[path]?.[method]?.parameters
      ?.filter((param) => param.in === 'header')
      .map((param) => param.name);

    if (_.isEmpty(params)) {
      return null;
    } else {
      const retObj = {};
      params.forEach((element) => {
        retObj[element] = '';
      });
      return retObj;
    }
  }

  getMethodProps(path, method) {
    const reqBodyToKeyMapping = (inObj) => {
      const retObj = {};
      for (const key in inObj) {
        retObj[key] = '';
      }
      return inObj ? retObj : null;
    };

    const props = {
      requestBody: reqBodyToKeyMapping(
        this.getJsonRequestBodyProperties(path, method)
      ),
      urlParams: this.getUrlParams(path, method),
      queryParams: this.getQueryParams(path, method),
      headerParams: this.getHeaderParams(path, method),
    };
    return this.api.paths[path]?.[method] ? props : null;
  }

  async generateRawODGConfig(configPath) {
    const file = configPath || this.odgJsonConfigPath;
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

  // ? async methods - initializers

  async #init() {
    await this.#initParser(this.resolveHandler, this.rejectHandler);
    // ? user main callback
    this.mainProgram ? this.mainProgram(this) : null;
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
