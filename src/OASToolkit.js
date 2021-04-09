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
              this.api.paths[item]?.head?.requestBody?.content[
                'application/json'
              ]?.schema?.properties
            ),
            urlParams: _.isEmpty(
              this.api.paths[item]?.head?.parameters
                ?.filter((param) => param.in === 'path')
                .map((param) => param.name)
            )
              ? null
              : this.api.paths[item]?.head?.parameters
                  ?.filter((param) => param.in === 'path')
                  .map((param) => param.name),
            queryParams: _.isEmpty(
              this.api.paths[item]?.head?.parameters
                ?.filter((param) => param.in === 'query')
                .map((param) => param.name)
            )
              ? null
              : this.api.paths[item]?.head?.parameters
                  ?.filter((param) => param.in === 'query')
                  .map((param) => param.name),
            headerParams: _.isEmpty(
              this.api.paths[item]?.head?.parameters
                ?.filter((param) => param.in === 'header')
                .map((param) => param.name)
            )
              ? null
              : this.api.paths[item]?.head?.parameters
                  ?.filter((param) => param.in === 'header')
                  .map((param) => param.name),
          },
          post: {
            requestBody: reqBodyToKeyMapping(
              this.api.paths[item]?.post?.requestBody?.content[
                'application/json'
              ]?.schema?.properties
            ),
            urlParams: _.isEmpty(
              this.api.paths[item]?.post?.parameters
                ?.filter((param) => param.in === 'path')
                .map((param) => param.name)
            )
              ? null
              : this.api.paths[item]?.post?.parameters
                  ?.filter((param) => param.in === 'path')
                  .map((param) => param.name),
            queryParams: _.isEmpty(
              this.api.paths[item]?.post?.parameters
                ?.filter((param) => param.in === 'query')
                .map((param) => param.name)
            )
              ? null
              : this.api.paths[item]?.post?.parameters
                  ?.filter((param) => param.in === 'query')
                  .map((param) => param.name),
            headerParams: _.isEmpty(
              this.api.paths[item]?.post?.parameters
                ?.filter((param) => param.in === 'header')
                .map((param) => param.name)
            )
              ? null
              : this.api.paths[item]?.post?.parameters
                  ?.filter((param) => param.in === 'header')
                  .map((param) => param.name),
          },
          get: {
            requestBody: reqBodyToKeyMapping(
              this.api.paths[item]?.get?.requestBody?.content[
                'application/json'
              ]?.schema?.properties
            ),
            urlParams: _.isEmpty(
              this.api.paths[item]?.get?.parameters
                ?.filter((param) => param.in === 'path')
                .map((param) => param.name)
            )
              ? null
              : this.api.paths[item]?.get?.parameters
                  ?.filter((param) => param.in === 'path')
                  .map((param) => param.name),
            queryParams: _.isEmpty(
              this.api.paths[item]?.get?.parameters
                ?.filter((param) => param.in === 'query')
                .map((param) => param.name)
            )
              ? null
              : this.api.paths[item]?.get?.parameters
                  ?.filter((param) => param.in === 'query')
                  .map((param) => param.name),
            headerParams: _.isEmpty(
              this.api.paths[item]?.get?.parameters
                ?.filter((param) => param.in === 'header')
                .map((param) => param.name)
            )
              ? null
              : this.api.paths[item]?.get?.parameters
                  ?.filter((param) => param.in === 'header')
                  .map((param) => param.name),
          },
          put: {
            requestBody: reqBodyToKeyMapping(
              this.api.paths[item]?.put?.requestBody?.content[
                'application/json'
              ]?.schema?.properties
            ),
            urlParams: _.isEmpty(
              this.api.paths[item]?.put?.parameters
                ?.filter((param) => param.in === 'path')
                .map((param) => param.name)
            )
              ? null
              : this.api.paths[item]?.put?.parameters
                  ?.filter((param) => param.in === 'path')
                  .map((param) => param.name),
            queryParams: _.isEmpty(
              this.api.paths[item]?.put?.parameters
                ?.filter((param) => param.in === 'query')
                .map((param) => param.name)
            )
              ? null
              : this.api.paths[item]?.put?.parameters
                  ?.filter((param) => param.in === 'query')
                  .map((param) => param.name),
            headerParams: _.isEmpty(
              this.api.paths[item]?.put?.parameters
                ?.filter((param) => param.in === 'header')
                .map((param) => param.name)
            )
              ? null
              : this.api.paths[item]?.put?.parameters
                  ?.filter((param) => param.in === 'header')
                  .map((param) => param.name),
          },
          patch: {
            requestBody: reqBodyToKeyMapping(
              this.api.paths[item]?.patch?.requestBody?.content[
                'application/json'
              ]?.schema?.properties
            ),
            urlParams: _.isEmpty(
              this.api.paths[item]?.patch?.parameters
                ?.filter((param) => param.in === 'path')
                .map((param) => param.name)
            )
              ? null
              : this.api.paths[item]?.patch?.parameters
                  ?.filter((param) => param.in === 'path')
                  .map((param) => param.name),
            queryParams: _.isEmpty(
              this.api.paths[item]?.patch?.parameters
                ?.filter((param) => param.in === 'query')
                .map((param) => param.name)
            )
              ? null
              : this.api.paths[item]?.patch?.parameters
                  ?.filter((param) => param.in === 'query')
                  .map((param) => param.name),
            headerParams: _.isEmpty(
              this.api.paths[item]?.patch?.parameters
                ?.filter((param) => param.in === 'header')
                .map((param) => param.name)
            )
              ? null
              : this.api.paths[item]?.patch?.parameters
                  ?.filter((param) => param.in === 'header')
                  .map((param) => param.name),
          },
          delete: {
            requestBody: reqBodyToKeyMapping(
              this.api.paths[item]?.delete?.requestBody?.content[
                'application/json'
              ]?.schema?.properties
            ),
            urlParams: _.isEmpty(
              this.api.paths[item]?.delete?.parameters
                ?.filter((param) => param.in === 'path')
                .map((param) => param.name)
            )
              ? null
              : this.api.paths[item]?.delete?.parameters
                  ?.filter((param) => param.in === 'path')
                  .map((param) => param.name),
            queryParams: _.isEmpty(
              this.api.paths[item]?.delete?.parameters
                ?.filter((param) => param.in === 'query')
                .map((param) => param.name)
            )
              ? null
              : this.api.paths[item]?.delete?.parameters
                  ?.filter((param) => param.in === 'query')
                  .map((param) => param.name),
            headerParams: _.isEmpty(
              this.api.paths[item]?.delete?.parameters
                ?.filter((param) => param.in === 'header')
                .map((param) => param.name)
            )
              ? null
              : this.api.paths[item]?.delete?.parameters
                  ?.filter((param) => param.in === 'header')
                  .map((param) => param.name),
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
