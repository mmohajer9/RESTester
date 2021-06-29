const _ = require('lodash');
const SearchBasedValueGenerator = require('./generator');

class RESTesterOracle extends SearchBasedValueGenerator {
  constructor(...props) {
    super(...props);
    // http method order for testing
    this.httpMethodOrder = ['head', 'post', 'get', 'put', 'patch', 'delete'];
    this.safeMethods = ['head', 'get'];
    this.nonSafeMethods = ['post', 'put', 'patch', 'delete'];
  }

  async responseValidatorOracle(
    path,
    method,
    data = {
      requestBody: {},
      queryParams: {},
      headerParams: {},
      urlParams: {},
    }
  ) {
    const { paths } = this.api;
    const expectedResponse = this.parseResponse(paths, path, method);
    const expectedResponseKeys = this.objectKeysArray(expectedResponse);

    let newPath = path;

    // placing url parameters into the new refined path
    if (!_.isEmpty(data.urlParams)) {
      for (const param in data.urlParams) {
        const pattern = `{${param}}`;
        const replacer = new RegExp(pattern, 'g');
        newPath = newPath.replace(replacer, data.urlParams[param]);
      }
    }

    let actualResponse = {};
    let actualResponseKeys = [];

    try {
      if (_.includes(this.safeMethods, method)) {
        actualResponse = await this.axios[method](newPath, {
          headers: data.headerParams,
          params: data.queryParams,
        });
      } else {
        actualResponse = await this.axios[method](newPath, data.requestBody, {
          headers: data.headerParams,
          params: data.queryParams,
        });
      }
      // getting the actual response keys
      actualResponseKeys = this.objectKeysArray(actualResponse);
    } catch (error) {
      const { status } = error.response;
    }

    return _.isEqual(expectedResponseKeys, actualResponseKeys);
  }

  async statusCodeOracle(path, method, data) {}
}

class TestCaseGenerator extends RESTesterOracle {
  constructor(...props) {
    super(...props);

    // initialize test case holders
    this.nominalTestCases = {
      200: [],
      400: [],
      500: [],
    };
    this.errorTestCases = {
      200: [],
      400: [],
      500: [],
    };
  }

  async generateNominals(useExample) {
    const { paths } = this.api;

    const testCase = {
      path: {},
      method: {},
      data: {},
    };

    for (const path in paths) {
      for (const method in paths[method]) {
        // use response dictionary with chance of 80%
        const useResponseDictionary = this.chance.bool({ likelihood: 80 });

        // this.
      }
    }

    if (useResponseDictionary) {
      // use response dictionary random seek
    } else {
      // use schema-based value generator
    }
  }
  async generateErrors(useExample) {}
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

  async generate(number, useExample = false) {
    await this.setup();

    for (let index = 0; index < number; index++) {
      this.generateNominals(useExample);
      this.generateErrors(useExample);
    }

    this.showProperty('api', 8);
  }
}

module.exports = RESTester;
