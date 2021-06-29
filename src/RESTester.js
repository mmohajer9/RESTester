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
  responseValidatorOracle(path, method, response) {}

  statusCodeOracle(path, method, response) {}
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
