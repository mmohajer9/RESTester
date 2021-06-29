const _ = require('lodash');
const SearchBasedValueGenerator = require('./generator');

class TestCaseGenerator extends SearchBasedValueGenerator {
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
}

class RESTesterOracle extends TestCaseGenerator {

  async oracle(path, method) {
    
  }

  responseValidatorOracle(path, method) {
    const { paths } = this.api;

    const expectedResponse = this.parseResponse(paths, path, method);
    const expectedResponseKeys = this.objectKeysArray(expectedResponse);
    const actualResponseKeys = this.objectKeysArray(actualResponse);

    return _.isEqual(expectedResponseKeys, actualResponseKeys);
  }

  statusCodeOracle(path, method) {}
}

class RESTester extends RESTesterOracle {
  async generate(number, useExample = false) {
    // create related directories for outputs
    await this.initiateOutputDirectories();

    // initiate response dictionary
    await this.initiateResponseDictionary();

    // set the api call order
    this.setApiCallOrder();
  }
}

module.exports = RESTester;
