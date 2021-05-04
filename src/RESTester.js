const SwaggerParser = require('@apidevtools/swagger-parser');
const DepGraph = require('dependency-graph').DepGraph;
const pathModule = require('path');
const jf = require('jsonfile');
const _ = require('lodash');
const ejs = require('ejs');
const uuid = require('uuid');
const util = require('util');
const fse = require('fs-extra');
const Chance = require('chance');
const faker = require('faker');

class BaseInitializer {
  constructor(
    // primary parameters
    mainProgram,
    oasConfPath = pathModule.join(config.oasConfDir, 'openapi.yaml'),
    odgConfPath = pathModule.join(config.odgConfDir, 'odg.json'),
    configOpts = {
      resolveHandler: undefined,
      rejectHandler: console.error,
    }
  ) {
    // initializing fields
    this.oasConfPath = oasConfPath;
    this.odgConfPath = odgConfPath;
    this.mainProgram = mainProgram;

    // initialize resolver/rejecter
    this.resolveHandler = configOpts.resolveHandler;
    this.rejectHandler = configOpts.rejectHandler;

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
    this.#setApiCallOrder();
  }

  // set api call order based on dependecies in odg.json
  #setApiCallOrder() {
    // first we justify how to call the api in the correct order
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

  // TODO Generate ODG config automatically based on similarity measures
  async generateODGConfig(configPath) {}

  // enerate raw ODG config which has no selected dependencies
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

  // helper methods which were used in other methods<- *

  getJsonRequestBodyProperties(path, method) {
    return this.api.paths[path]?.[method]?.requestBody?.content['application/json']?.schema
      ?.properties;
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
      requestBody: reqBodyToKeyMapping(this.getJsonRequestBodyProperties(path, method)),
      urlParams: this.getUrlParams(path, method),
      queryParams: this.getQueryParams(path, method),
      headerParams: this.getHeaderParams(path, method),
    };
    return this.api.paths[path]?.[method] ? props : null;
  }
}

class BaseRESTester extends ODGInitializer {
  constructor(...props) {
    super(...props);
    // http method order for testing
    this.httpMethodOrder = ['head', 'post', 'get', 'put', 'patch', 'delete'];
    this.chance = new Chance();
    this.faker = faker;
    this.responseDictionary = {};
  }

  // wrapper method for easy rendering templates
  async renderTemplateToFile(templateDir, templateName, context, outputDir, outputName) {
    const templatePath = pathModule.join(templateDir, templateName);
    const fileContent = await ejs.renderFile(templatePath, context);
    const uuidv1 = uuid.v1();
    const outputFileName = `test-${outputName}-${uuidv1}.test.js`;
    const outputPath = pathModule.join(outputDir, outputFileName);
    fse.ensureFileSync(outputPath);
    fse.outputFileSync(outputPath, fileContent);
  }
  // wrapper method for creating json config files

  async readJSONConfig(outputDir, outputName) {
    const outputPath = pathModule.join(outputDir, outputName);
    if (fse.existsSync(outputPath)) {
      return fse.readJsonSync(outputPath);
    } else {
      return null;
    }
  }

  async createJSONConfig(jsonConfig, outputDir, outputName) {
    const outputPath = pathModule.join(outputDir, outputName);
    try {
      await jf.writeFile(outputPath, jsonConfig, { spaces: 2, EOL: '\r\n' });
      return jsonConfig;
    } catch (err) {
      this.rejectHandler(err);
      return null;
    }
  }
  typeValueGenerator(property, useExample = false) {
    let result = null;
    switch (property.type) {
      case 'integer':
        useExample && property.example
          ? (result = property.example)
          : (result = this.chance.integer({ min: 1, max: 1000 }));
        break;
      case 'number':
        useExample && property.example
          ? (result = property.example)
          : (result = this.chance.floating({ min: 0, max: 100, fixed: 2 }));
        break;
      case 'string':
        useExample && property.example
          ? (result = property.example)
          : (result = `${this.chance.animal()} ${this.chance.name()}`);
        break;
      case 'boolean':
        useExample && property.example
          ? (result = property.example)
          : (result = this.chance.bool());
        break;
      case 'array':
        // this will be another array nested inside the object
        result = [];
        for (let index = 0; index < this.chance.integer({ min: 0, max: 10 }); index++) {
          result[index] = this.typeValueGenerator(property.items, useExample);
        }
        break;
      case 'object':
        // this will be another object nested inside the object
        result = {};
        for (const key in property.properties) {
          result[key] = this.typeValueGenerator(property.properties[key], useExample);
        }
        break;
      default:
        break;
    }

    const defaultItem = property.default;
    const enumItems = property.enum;

    if (defaultItem) {
      result = defaultItem;
    }

    if (enumItems) {
      result = enumItems[Math.floor(Math.random() * enumItems.length)];
    }

    return result;
  }
  // generate a request body object
  requestBodySchemaValueGenerator(apiPath, method, contentType, useExample = false) {
    const requestBody = this.api.paths[apiPath]?.[method]?.requestBody;
    if (!requestBody) {
      // if the api path for the given method does not have the request body,
      // the generated request body should be empty
      return {};
    }

    const requestBodyRequired = requestBody.required;
    // generate empty request with likelihood of 20%
    if (!requestBodyRequired) {
      const useEmptyRequestBody = this.chance.bool({ likelihood: 20 });
      if (useEmptyRequestBody) {
        return {};
      }
    }
    // request body schema
    const schema = requestBody.content[contentType]?.schema;

    // these variables has not been used yet
    const schemaRequiredFields = schema.required;

    // type of schema
    const schemaType = schema.type;

    // generated output
    let output = {};

    if (schemaType === 'object') {
      // request body properties for the given schema
      output = this.typeValueGenerator(schema, useExample);
    } else if (schemaType === 'array') {
      output = this.typeValueGenerator(schema, useExample);
    }

    return output;
  }
  // generate query param object
  QueryParamSchemaGenerator(apiPath, method, useExample = false) {
    const parameters = this.api.paths[apiPath]?.[method]?.parameters;

    if (!parameters) {
      // no parameters is specified
      return {};
    }
    const output = {};

    const queryParams = parameters.filter((param) => param.in === 'query');

    for (const param of queryParams) {
      if (!param.required) {
        const useEmptyParam = this.chance.bool({ likelihood: 20 });
        if (useEmptyParam) {
          return {};
        }
      }
      output[param.name] = this.typeValueGenerator(param.schema, useExample);
    }

    return output;
  }
  // generate header param object
  HeaderParamSchemaGenerator(apiPath, method, useExample = false) {
    const parameters = this.api.paths[apiPath]?.[method]?.parameters;

    if (!parameters) {
      // no parameters is specified
      return {};
    }
    const output = {};

    const headerParams = parameters.filter((param) => param.in === 'header');

    for (const param of headerParams) {
      if (!param.required) {
        const useEmptyParam = this.chance.bool({ likelihood: 20 });
        if (useEmptyParam) {
          return {};
        }
      }
      output[param.name] = this.typeValueGenerator(param.schema, useExample);
    }

    return output;
  }
  // generate URL parameter value
  URLParamSchemaGenerator(apiPath, method, useExample = false) {
    const parameters = this.api.paths[apiPath]?.[method]?.parameters;

    if (!parameters) {
      // no parameters is specified
      return {};
    }
    const output = {};

    const pathParams = parameters.filter((param) => param.in === 'path');

    for (const param of pathParams) {
      if (!param.required) {
        const useEmptyParam = this.chance.bool({ likelihood: 20 });
        if (useEmptyParam) {
          return {};
        }
      }
      output[param.name] = this.typeValueGenerator(param.schema, useExample);
    }

    return output;
  }

  async initiateResponseDictionary(apiName) {
    const paths = this.apiCallOrder;
    const responseDictionary = await this.readJSONConfig(
      config.apiCommonDir(apiName),
      'responseDictionary.json'
    );

    if (responseDictionary) {
      this.responseDictionary = responseDictionary;
    } else {
      const jsonConfig = {};
      paths.forEach((path) => {
        jsonConfig[path] = {
          responses: [],
        };
      });
      this.responseDictionary = await this.createJSONConfig(
        jsonConfig,
        config.apiCommonDir(apiName),
        'responseDictionary.json'
      );
    }
  }
}

class RESTester extends BaseRESTester {
  async generateTestCases() {
    // const out = await this.requestBodySchemaValueGenerator('/pet', 'post', 'application/json');
    // this.URLParamSchemaGenerator('/pet/{petId}', 'get', 'application/json');

    // nominalTestCases
    this.generateNominalTestCases();
    // errorTestCases
    this.generateErrorTestCases();
  }

  async generateNominalTestCases() {
    // response-dictionary -> search-based
    this.initiateResponseDictionary('petStore');

    // schema-based test case generation
  }

  async generateErrorTestCases() {
    // mutation of the nominal test cases to generate error test cases
  }

  async statusCodeOracle() {}

  async responseValidationOracle() {}
}

module.exports = RESTester;
