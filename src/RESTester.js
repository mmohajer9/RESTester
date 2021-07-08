const _ = require('lodash');
const pathModule = require('path');
const TestCaseGenerator = require('./tester');
const moment = require('moment');

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

  async generate(
    number,
    rdRatio = 100,
    useExample = false,
    useAllMethods = false
  ) {
    await this.setup();

    for (let index = 0; index < number; index++) {
      // nominal test cases
      await this.generateNominals(rdRatio, useExample, useAllMethods);

      // error test cases
      await this.generateErrors();
    }

    // code generation
    await this.generateCode('nominal', 'json');
    await this.generateCode('error', 'json');
  }

  async generateCode(mode, type = 'json', name = 'testcase') {
    const { name: apiName } = this.api;
    const stamp = moment().format('YYYY-MM-DD_HH-mm-ss');

    if (mode === 'nominal') {
      // taking the nominal test cases directory

      const successCount = this.nominalTestCases[200].length;
      const clientErrorCount = this.nominalTestCases[400].length;
      const serverErrorCount = this.nominalTestCases[500].length;
      const invalidResposneCount = this.nominalTestCases.invalidResponse.length;
      const totalTestCases =
        successCount +
        clientErrorCount +
        serverErrorCount +
        invalidResposneCount;

      switch (type) {
        case 'json':
          const result = {
            evaluation: {
              total: totalTestCases,
              hitRate:
                +(
                  (successCount + serverErrorCount + invalidResposneCount) /
                  totalTestCases
                ).toFixed(2) * 100,
              missRate: +(clientErrorCount / totalTestCases).toFixed(2) * 100,
              coverage:
                +(
                  successCount /
                  (successCount + serverErrorCount + invalidResposneCount)
                ).toFixed(2) * 100,

              200: successCount,
              400: clientErrorCount,
              500: serverErrorCount,
              invalidResponse: invalidResposneCount,
            },
            data: this.nominalTestCases,
          };

          // getting the right path and file name
          const dir = config.apiNominalJsonTestCasesDir(apiName);
          const fileName = `${mode}-${name}-${stamp}.${type}`;
          const path = pathModule.join(dir, fileName);
          await this.createJSONFile(path, result);

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
          const result = {
            evaluation: {
              total: 0,
              hitRate: 0,
              missRate: 0,
              coverage: 0,
              200: 0,
              400: 0,
              500: 0,
              invalidResponse: 0,
            },
            data: this.errorTestCases,
          };
          const dir = config.apiErrorJsonTestCasesDir(apiName);
          const fileName = `${mode}-${name}-${stamp}.${type}`;
          const path = pathModule.join(dir, fileName);
          await this.createJSONFile(path, result);

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
