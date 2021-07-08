const _ = require('lodash');
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
    const { 200: successfulTestCases } = _.cloneDeep(this.nominalTestCases);

    for (const testCase of successfulTestCases) {
      const mutatedTestCase = this.mutate(testCase);
      console.log(mutatedTestCase);
      await this.oracle(mutatedTestCase, 'error');
    }
    this.inspect(successfulTestCases, 10);
  }

  inputTypeMutation(testCase) {
    const { testData } = testCase;

    const dataTypes = ['string', 'number', 'boolean', 'object', 'array'];

    for (const key in testData) {
      const parameter = testData[key];
      for (const field in parameter) {
        const randomIndex = Math.floor(Math.random() * dataTypes.length);
        const dataType = dataTypes[randomIndex];
        switch (dataType) {
          case 'string':
            parameter[field] = this.chance.string();
            break;
          case 'number':
            parameter[field] = this.chance.bool()
              ? this.chance.integer()
              : this.chance.floating();
            break;
          case 'boolean':
            parameter[field] = this.chance.bool();
            break;
          case 'object':
            parameter[field] = this.chance.bool() ? parameter[field] : {};
            break;
          case 'array':
            parameter[field] = this.chance.bool() ? parameter[field] : [];
            break;
          default:
            break;
        }
      }
    }

    return testCase;
  }

  mutate(testCase) {
    let mutatedTestCase = testCase;

    mutatedTestCase = this.inputTypeMutation(mutatedTestCase);
    // mutatedTestCase = this.ExplosionMutation(mutatedTestCase);

    return mutatedTestCase;
  }
}

class TestCaseGenerator extends ErrorTestCaseGenerator {}

module.exports = TestCaseGenerator;
