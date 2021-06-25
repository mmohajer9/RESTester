const pathModule = require('path');
const jf = require('jsonfile');
const ejs = require('ejs');
const fse = require('fs-extra');
const faker = require('faker');
const axios = require('axios');

const ODGConfigGenerator = require('./odg');

class AbstractBaseRESTester extends ODGConfigGenerator {
  constructor(...props) {
    super(...props);
    // http method order for testing
    this.httpMethodOrder = ['head', 'post', 'get', 'put', 'patch', 'delete'];
    this.faker = faker;
    this.responseDictionary = {};
  }

  // wrapper method for easy rendering templates
  async renderTemplateToFile(
    templateDir,
    templateName,
    context,
    outputDir,
    outputName
  ) {
    const templatePath = pathModule.join(templateDir, templateName);
    const fileContent = await ejs.renderFile(templatePath, context);
    const outputPath = pathModule.join(outputDir, outputName);
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
        for (
          let index = 0;
          index < this.chance.integer({ min: 0, max: 10 });
          index++
        ) {
          result[index] = this.typeValueGenerator(property.items, useExample);
        }
        break;
      case 'object':
        // this will be another object nested inside the object
        result = {};
        for (const key in property.properties) {
          result[key] = this.typeValueGenerator(
            property.properties[key],
            useExample
          );
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
  requestBodySchemaValueGenerator(
    apiPath,
    method,
    contentType,
    useExample = false
  ) {
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
  queryParamSchemaGenerator(apiPath, method, useExample = false) {
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
        if (useEmptyParam && param.schema.default) {
          return { [param.name]: param.schema.default };
        }
      }
      output[param.name] = this.typeValueGenerator(param.schema, useExample);
    }

    return output;
  }
  // generate header param object
  headerParamSchemaGenerator(apiPath, method, useExample = false) {
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
  // response dictionary methods

  responseDictionaryRandomSeek(apiPath, method) {
    // will return undefined if the list is empty
    const list = this.responseDictionary[apiPath].responses[method];
    const output = list[Math.floor(Math.random() * list.length)];
    return output;
  }

  async initiateResponseDictionary(apiName) {
    // check for the existence of response dictionary
    // if it is existed , then it will fetch it into the program
    // if it is not existed , it will create a new one
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
          responses: {
            get: [],
            post: [],
            put: [],
            patch: [],
            delete: [],
          },
        };
      });
      this.responseDictionary = await this.createJSONConfig(
        jsonConfig,
        config.apiCommonDir(apiName),
        'responseDictionary.json'
      );
    }
  }

  async updateResponseDictionary(apiName, newJSONConfig) {
    // updating the response dictionary both in the disk and program
    this.responseDictionary = await this.createJSONConfig(
      newJSONConfig,
      config.apiCommonDir(apiName),
      'responseDictionary.json'
    );
  }
}

class BaseRESTester extends AbstractBaseRESTester {
  constructor(...props) {
    super(...props);
    // initiating response dictionary
    this.initiateResponseDictionary('petStore');

    // for storing generated test cases
    this.nominalTestCases = [];
    this.errorTestCases = [];

    // for storing request handler instance
    this.axios = {};
  }

  initiateRequestHandler() {
    const instance = axios.create({
      baseURL: this.api.servers[0].url,
    });
    this.axios = instance;
  }

  async generateRequest(testCase) {
    try {
      const urlParams = testCase.data.urlParams;
      let path = testCase.path;
      for (const parameter in urlParams) {
        path = path
          .replace(/({|})/g, '')
          .replace(parameter, urlParams[parameter]);
      }
      console.log('PATH ::: ', path);

      if (testCase.method === 'get') {
        const response = await this.axios[testCase.method](path, {
          params: testCase.data.queryParams,
          headers: testCase.data.headers,
        });
        return {
          responseData: response.data,
          responseStatus: response.status,
        };
      } else {
        const response = await this.axios[testCase.method](
          path,
          testCase.data.requestBody,
          {
            params: testCase.data.queryParams,
            headers: testCase.data.headers,
          }
        );
        return {
          responseData: response.data,
          responseStatus: response.status,
        };
      }
    } catch (error) {
      return {
        responseData: error.response.data,
        responseStatus: error.response.status,
      };
    }
  }

  generateSchemaBasedTestData(path, method, useExample = false) {
    // if the method of the path is not existed then it will return null
    if (!this.api.paths[path][method]) {
      return null;
    }

    // generating schema-based request body and parameters
    const requestBody = this.requestBodySchemaValueGenerator(
      path,
      method,
      'application/json',
      useExample
    );
    const urlParams = this.URLParamSchemaGenerator(path, method, useExample);
    const queryParams = this.queryParamSchemaGenerator(
      path,
      method,
      useExample
    );
    const headers = this.headerParamSchemaGenerator(path, method, useExample);

    // stocking all values into a one output as a test data object
    const testData = { requestBody, urlParams, queryParams, headers };
    return testData;
  }

  generateNominalTestCase(useExample = false) {
    //TODO response-dictionary -> search-based approach
    // if it is empty , it won't proceed anymore and will use other approach
    // this.responseDictionaryRandomSeek('/pet/findByStatus', 'get')

    // schema-based test case generation - random approach
    // generate one test data for each of the api calls based on the http method order
    for (const path of this.apiCallOrder) {
      for (const method of this.httpMethodOrder) {
        if (!this.api.paths[path][method]) {
          continue;
        } else {
          const testData = this.generateSchemaBasedTestData(
            path,
            method,
            useExample
          );
          this.nominalTestCases.push({
            path,
            method,
            data: testData,
          });
        }
      }
    }
  }

  generateErrorTestCase(useExample) {
    //TODO mutation of the nominal test cases to generate error test cases
  }

  async oracle(mode) {
    await this.statusCodeOracle(mode);
    await this.responseValidationOracle(mode);
  }

  async statusCodeOracle(mode) {
    // check for the output and generate test files
    // then the response should be added to response dictionary if the status is 200 (OK)

    const list =
      mode === 'nominals'
        ? this.nominalTestCases
        : mode === 'errors'
        ? this.errorTestCases
        : null;
    for (const [index, testCase] of list.entries()) {
      const result = await this.generateRequest(testCase);
      if (result.responseStatus >= 200) {
        // creating axios config
        let context = {
          baseURL: this.api.servers[0].url,
        };
        // generate unique number
        let uniqueNumber = Date.now();
        await this.renderTemplateToFile(
          config.apiTemplatesDir('petStore'),
          'axios-config-template.ejs',
          context,
          config.apiNominalTestCasesDir('petStore'),
          `/${uniqueNumber}/axiosInstance.js`
        );
        // creating JSON config file
        this.createJSONConfig(
          { ...testCase.data },
          config.apiNominalTestCasesDir('petStore'),
          `/${uniqueNumber}/config.json`
        );
        // creating request file

        context = {
          path: testCase.path,
          method: testCase.method,
          testCaseDescription: `test case generated by RESTester - ${uniqueNumber}`,
        };

        // await this.renderTemplateToFile(
        //   config.apiTemplatesDir('petStore'),
        //   'axios-request-file.ejs',
        //   context,
        //   config.apiNominalTestCasesDir('petStore'),
        //   `/${uniqueNumber}/request-${index}.js`
        // );

        await this.renderTemplateToFile(
          config.apiTemplatesDir('petStore'),
          'jest-test-case-template.ejs',
          context,
          config.apiNominalTestCasesDir('petStore'),
          `/${uniqueNumber}/${index}.test.js`
        );
      } else if (result.responseStatus >= 500) {
      }
    }
  }

  async responseValidationOracle(mode) {
    //TODO check for the output and generate test files
    // console.log(this.api.paths['/pet'].post.responses['200'].content);
  }
}

class RESTester extends BaseRESTester {
  // set api call order based on dependecies in odg.json
  setApiCallOrder() {
    // first we justify how to call the api in the correct order
    try {
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
      console.log(chalk.cyan('API Call Order Has Been Set'));
    } catch (error) {
      console.log(chalk.redBright('No ODG Configuration Has Been Provided'));
      console.log(chalk.yellowBright('Check ODG Config Directory'));
      return;
    }
  }

  async generateTestCases(testCaseNumber = 1, useExample = false) {
    // set api call order based on dependecies in odg.json
    this.setApiCallOrder();
    // initiate request handler like axios
    this.initiateRequestHandler();
    // iterate for amount of test case number
    // create a set of test cases for all api paths per each iteration
    for (let index = 0; index < testCaseNumber; index++) {
      // nominal test cases
      this.generateNominalTestCase(useExample);
      // error test cases
      this.generateErrorTestCase(useExample);
    }
    // call oracles for nominal and error test cases
    await this.oracle('nominals');
    await this.oracle('errors');
    // const inspected = util.inspect(this.nominalTestCases, false, 4, true);
    // console.log(inspected);
  }
}

module.exports = RESTester;
