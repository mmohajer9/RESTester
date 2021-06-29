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

  // generate schema-based value for the parameter given to the method
  generateSchemaBased(path, method, parameterType, useExample = false) {
    // if the method of the path is not existed then it will return null
    if (!this.api.paths[path][method]) {
      return null;
    }

    let result = null;

    switch (parameterType) {
      case 'requestBody':
        result = this.requestBodySchemaValueGenerator(path, method, useExample);
        break;

      // default means : query , header , path --> these types are going to be executed
      default:
        result = this.parameterTypeSchemaValueGenerator(
          path,
          method,
          parameterType,
          useExample
        );
        break;
    }

    return result;
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
