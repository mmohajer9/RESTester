const SwaggerParser = require('@apidevtools/swagger-parser');
const DepGraph = require('dependency-graph').DepGraph;
const pathModule = require('path');
const jf = require('jsonfile');
const _ = require('lodash');

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
    this.order = ['head', 'post', 'get', 'put', 'patch', 'delete'];

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

  getJsonRequestBodyProperties(path, method) {
    return this.api.paths[path]?.[method]?.requestBody?.content[
      'application/json'
    ]?.schema?.properties;
  }

  getUrlParams(path, method) {
    return _.isEmpty(
      this.api.paths[path]?.[method]?.parameters
        ?.filter((param) => param.in === 'path')
        .map((param) => param.name)
    )
      ? null
      : this.api.paths[path]?.[method]?.parameters
          ?.filter((param) => param.in === 'path')
          .map((param) => param.name);
  }

  getQueryParams(path, method) {
    return _.isEmpty(
      this.api.paths[path]?.[method]?.parameters
        ?.filter((param) => param.in === 'query')
        .map((param) => param.name)
    )
      ? null
      : this.api.paths[path]?.[method]?.parameters
          ?.filter((param) => param.in === 'query')
          .map((param) => param.name);
  }

  getHeaderParams(path, method) {
    return _.isEmpty(
      this.api.paths[path]?.[method]?.parameters
        ?.filter((param) => param.in === 'header')
        .map((param) => param.name)
    )
      ? null
      : this.api.paths[path]?.[method]?.parameters
          ?.filter((param) => param.in === 'header')
          .map((param) => param.name);
  }

  async generateRawODG(configPath) {
    const file = configPath || this.odgJsonConfigPath;
    const configs = [];
    const reqBodyToKeyMapping = (inObj) => {
      const retObj = {};
      for (const key in inObj) {
        retObj[key] = '';
      }
      return inObj ? retObj : null;
    };

    for (const item in this.api.paths) {
      configs.push({
        endpoint: item,
        dependsOn: [],
        derivedProps: {
          head: {
            requestBody: reqBodyToKeyMapping(
              this.getJsonRequestBodyProperties(item, 'head')
            ),
            urlParams: this.getUrlParams(item, 'head'),
            queryParams: this.getQueryParams(item, 'head'),
            headerParams: this.getHeaderParams(item, 'head'),
          },
          post: {
            requestBody: reqBodyToKeyMapping(
              this.getJsonRequestBodyProperties(item, 'post')
            ),
            urlParams: this.getUrlParams(item, 'post'),
            queryParams: this.getQueryParams(item, 'post'),
            headerParams: this.getHeaderParams(item, 'post'),
          },
          get: {
            requestBody: reqBodyToKeyMapping(
              this.getJsonRequestBodyProperties(item, 'get')
            ),
            urlParams: this.getUrlParams(item, 'get'),
            queryParams: this.getQueryParams(item, 'get'),
            headerParams: this.getHeaderParams(item, 'get'),
          },
          put: {
            requestBody: reqBodyToKeyMapping(
              this.getJsonRequestBodyProperties(item, 'put')
            ),
            urlParams: this.getUrlParams(item, 'put'),
            queryParams: this.getQueryParams(item, 'put'),
            headerParams: this.getHeaderParams(item, 'put'),
          },
          patch: {
            requestBody: reqBodyToKeyMapping(
              this.getJsonRequestBodyProperties(item, 'patch')
            ),
            urlParams: this.getUrlParams(item, 'patch'),
            queryParams: this.getQueryParams(item, 'patch'),
            headerParams: this.getHeaderParams(item, 'patch'),
          },
          delete: {
            requestBody: reqBodyToKeyMapping(
              this.getJsonRequestBodyProperties(item, 'delete')
            ),
            urlParams: this.getUrlParams(item, 'delete'),
            queryParams: this.getQueryParams(item, 'delete'),
            headerParams: this.getHeaderParams(item, 'delete'),
          },
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
