const RESTesterOracle = require('./oracle');

class NominalTestCaseGenerator extends RESTesterOracle {
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
        await this.oracle(testCase, 'nominal');
      }
    }
  }
}

class ErrorTestCaseGenerator extends NominalTestCaseGenerator {
  async generateErrors() {
    const { 200: successfulTestCases } = this.nominalTestCases;

    for (const testCase of successfulTestCases) {
      const mutatedTestCase = this.mutate(testCase);
      await this.oracle(mutatedTestCase, 'error');
    }
  }

  mutate(testCase){
    
  }
}

class TestCaseGenerator extends ErrorTestCaseGenerator {}

module.exports = TestCaseGenerator;
