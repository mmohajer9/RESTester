const TestDataGenerator = require('./generator');

class TestCaseGenerator extends TestDataGenerator {
  constructor(...props) {
    super(...props);
    // TODO: fix this
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
}

class RESTester extends TestCaseGenerator {
  generate(number, useExample = false) {
    // first set the api call order
    this.setApiCallOrder();

    this.show(1);
  }
}

module.exports = RESTester;
