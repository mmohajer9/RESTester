const _ = require('lodash');
const TestDataGenerator = require('./generator');
const pathModule = require('path');
class RESTesterOracle extends TestDataGenerator {
  constructor(...props) {
    super(...props);
    // http method order for testing
    this.httpMethodOrder = ['head', 'post', 'get', 'put', 'patch', 'delete'];
    this.safeMethods = ['head', 'get'];
    this.nonSafeMethods = ['post', 'put', 'patch', 'delete'];

    // initialize test case holders
    this.nominalTestCases = {
      200: [],
      400: [],
      500: [],
      invalidResponse: [],
    };
    this.errorTestCases = {
      200: [],
      400: [],
      500: [],
    };
  }

  async oracle(testCase) {
    // destructuring values
    const { path, method, testData } = testCase;
    const { data, status } = await this.makeRequest(path, method, testData);

    if (status >= 200 && status < 400) {
      await this.responseValidatorOracle(testCase, data);
    }
    await this.statusCodeOracle(testCase, status);
  }

  async responseValidatorOracle(testCase, responseData) {
    const { paths } = this.api;
    const { path, method } = testCase;
    // taking the expected response from specification
    const expectedResponse = this.parseResponse(paths, path, method);
    const expectedResponseKeys = this.objectKeysArray(expectedResponse);
    // for json array responses
    const actualResponse = _.isArrayLike(responseData)
      ? responseData[0]
      : responseData;
    const actualResponseKeys = this.objectKeysArray(actualResponse);

    // performing equality check between two arrays regardless of ordering
    const difference = _.difference(expectedResponseKeys, actualResponseKeys);
    const isEqual = _.isEmpty(difference);

    if (!isEqual) {
      this.nominalTestCases.invalidResponse.push(testCase);
    }
  }

  async statusCodeOracle(testCase, status) {
    const { path, method, testData } = testCase;

    if (status >= 200 && status < 400) {
      this.nominalTestCases[200].push(testCase);
      await this.addToResponseDictionary(path, method, testData);
    } else if (status >= 400 && status < 500) {
      this.nominalTestCases[400].push(testCase);
    } else if (status >= 500) {
      this.nominalTestCases[500].push(testCase);
      await this.addToResponseDictionary(path, method, testData);
    }
  }

  async makeRequest(path, method, testData) {
    // creating new path variable for url parameters
    let newPath = path;

    // placing url parameters into the new refined path
    if (!_.isEmpty(testData.urlParams)) {
      for (const param in testData.urlParams) {
        const pattern = `{${param}}`;
        const replacer = new RegExp(pattern, 'g');
        newPath = newPath.replace(replacer, testData.urlParams[param]);
      }
    }

    const result = {
      data: null,
      status: null,
    };

    try {
      if (_.includes(this.safeMethods, method)) {
        const { data, status } = await this.axios[method](newPath, {
          headers: testData.headerParams,
          params: testData.queryParams,
        });

        result.data = data;
        result.status = status;
      } else {
        const { data, status } = await this.axios[method](
          newPath,
          testData.requestBody,
          {
            headers: testData.headerParams,
            params: testData.queryParams,
          }
        );
        result.data = data;
        result.status = status;
      }
    } catch (error) {
      const { status, data } = error.response;
      result.status = status;
      result.data = data;
    }

    console.log(
      `============================== TEST FOR ${path} > ${method} ==============================`
    );
    console.log(`TEST DATA : `, testData);
    console.log(`NEW PATH : `, newPath);
    console.log(`RESULT : `, result);
    return result;
  }
}

class TestCaseGenerator extends RESTesterOracle {
  constructor(...props) {
    super(...props);
  }

  async generateNominals(rdRatio, useExample) {
    const { paths } = this.api;
    for (const path in paths) {
      // const methods = paths[path];
      const methodsOrder = this.httpMethodOrder;
      for (const method of methodsOrder) {
        const testData = await this.getTestData(
          path,
          method,
          rdRatio,
          useExample
        );
        const testCase = { path, method, testData };
        await this.oracle(testCase);
      }
    }
  }
  async generateErrors() {}
}

class RESTester extends TestCaseGenerator {
  async setup() {
    // create related directories for outputs
    await this.initiateOutputDirectories();

    // initiate response dictionary
    await this.initiateResponseDictionary();

    // set the api call order
    this.setApiCallOrder();

    // set axios instance for sending requests
    this.setRequestHandler();
  }

  async generate(number, rdRatio = 100, useExample = true) {
    await this.setup();

    for (let index = 0; index < number; index++) {
      await this.generateNominals(rdRatio, useExample);
      await this.generateErrors();
    }

    await this.generateCode('nominal', 'json');
    await this.generateCode('error', 'json');
  }

  async generateCode(mode, type = 'json', name = 'testcase', stamp = _.now()) {
    const { name: apiName } = this.api;

    if (mode === 'nominal') {
      // taking the nominal test cases directory

      switch (type) {
        case 'json':
          // getting the right path and file name
          const dir = config.apiNominalJsonTestCasesDir(apiName);
          const fileName = `${mode}-${name}-${stamp}.${type}`;
          const path = pathModule.join(dir, fileName);
          await this.createJSONFile(path, this.nominalTestCases);

          break;
        case 'jest':
          break;
        case 'js':
          break;

        default:
          break;
      }
    } else if (mode === 'error') {
      // taking the error test cases directory

      switch (type) {
        case 'json':
          const dir = config.apiErrorJsonTestCasesDir(apiName);
          const fileName = `${mode}-${name}-${stamp}.${type}`;
          const path = pathModule.join(dir, fileName);
          await this.createJSONFile(path, this.errorTestCases);

          break;
        case 'jest':
          break;
        case 'js':
          break;

        default:
          break;
      }
    }
  }
}

module.exports = RESTester;
