const RESTesterOracle = require('./oracle');

class NominalTestCaseGenerator extends RESTesterOracle {
  constructor(...props) {
    super(...props);
  }

  async generateNominals(rdRatio, useExample, useAllMethods) {
    const { paths } = this.api;
    const apiCallOrder = this.apiCallOrder;

    for (const path of apiCallOrder) {
      // const methods = this.objectKeysArray(paths[path]);
      const methods = this.httpMethodOrder;

      for (const method of methods) {
        if (!paths[path][method] && !useAllMethods) {
          continue;
        }

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
}

class ErrorTestCaseGenerator extends NominalTestCaseGenerator {
  async generateErrors() {}
}

class TestCaseGenerator extends ErrorTestCaseGenerator {}

module.exports = TestCaseGenerator;
