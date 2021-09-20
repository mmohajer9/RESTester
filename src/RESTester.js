const _ = require('lodash');
const pathModule = require('path');
const TestCaseGenerator = require('./tester');
const moment = require('moment');
const { plot, stack } = require('nodeplotlib');
const fse = require('fs-extra');

class RESTester extends TestCaseGenerator {
  async setup() {
    // create related directories for outputs
    await this.initiateOutputDirectories();

    // initiate response dictionary
    await this.initiateResponseDictionary();

    // set the api call order
    await this.setApiCallOrder();

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
      // code generation
      await this.generateCode('nominal', 'json');
      await this.generateCode('error', 'json');
      // make test cases properties empty
      this.flushTestCases();
    }

    // // code generation
    // await this.generateCode('nominal', 'json');
    // await this.generateCode('error', 'json');
  }

  async generateCode(mode, type = 'json', name = 'testcase') {
    const { name: apiName } = this.api;
    const stamp = moment().format('YYYY-MM-DD_HH-mm-ss');

    const testCases =
      mode === 'nominal'
        ? this.nominalTestCases
        : mode === 'error'
        ? this.errorTestCases
        : null;

    const successCount = testCases[200].length;
    const clientErrorCount = testCases[400].length;
    const serverErrorCount = testCases[500].length;
    const invalidResposneCount = testCases.invalidResponse.length;
    const totalTestCases = successCount + clientErrorCount + serverErrorCount;

    if (mode === 'nominal') {
      // taking the nominal test cases directory

      switch (type) {
        case 'json':
          const result = {
            evaluation: {
              total: totalTestCases,
              hitRate:
                +((successCount + serverErrorCount) / totalTestCases).toFixed(
                  2
                ) * 100,
              missRate: +(clientErrorCount / totalTestCases).toFixed(2) * 100,
              coverage:
                +(successCount / (successCount + serverErrorCount)).toFixed(2) *
                100,

              200: successCount,
              400: clientErrorCount,
              500: serverErrorCount,
              invalidResponse: invalidResposneCount,
            },
            data: testCases,
          };

          // getting the right path and file name
          const dir = config.apiNominalJsonTestCasesDir(apiName);
          const fileName = `${mode}-${name}-${stamp}.${type}`;
          const path = pathModule.join(dir, fileName);
          await this.createJSONFile(path, result);
          if (this.outputDir) {
            const outputPath = pathModule.join(this.outputDir, fileName);
            await this.createJSONFile(outputPath, result);
          }

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
              total: totalTestCases,
              hitRate:
                +((successCount + serverErrorCount) / totalTestCases).toFixed(
                  2
                ) * 100,
              missRate: +(clientErrorCount / totalTestCases).toFixed(2) * 100,
              errorCoverage:
                +(
                  clientErrorCount /
                  (successCount + serverErrorCount + clientErrorCount)
                ).toFixed(2) * 100,

              200: successCount,
              400: clientErrorCount,
              500: serverErrorCount,
              invalidResponse: invalidResposneCount,
            },
            data: testCases,
          };
          const dir = config.apiErrorJsonTestCasesDir(apiName);
          const fileName = `${mode}-${name}-${stamp}.${type}`;
          const path = pathModule.join(dir, fileName);
          await this.createJSONFile(path, result);
          if (this.outputDir) {
            const outputPath = pathModule.join(this.outputDir, fileName);
            await this.createJSONFile(outputPath, result);
          }

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

  async plotResult() {
    const nominalDir = config.apiNominalJsonTestCasesDir(this.api.name);
    const errorDir = config.apiErrorJsonTestCasesDir(this.api.name);

    const nominalStats = { coverage: [] };
    const nominalFiles = await fse.readdir(nominalDir);

    for (const filename of nominalFiles) {
      const obj = await this.readJSONFile(
        pathModule.join(nominalDir, filename)
      );
      nominalStats.coverage.push(Math.round(obj.evaluation.coverage));
    }

    const errorStats = { errorCoverage: [] };
    const errorFiles = await fse.readdir(errorDir);

    for (const filename of errorFiles) {
      const obj = await this.readJSONFile(pathModule.join(errorDir, filename));
      errorStats.errorCoverage.push(Math.round(obj.evaluation.errorCoverage));
    }

    const nominalData = [
      {
        x: _.range(1, nominalFiles.length + 1),
        y: nominalStats.coverage,
        mode: 'lines+markers',
        type: 'scatter',
        marker: {
          color: 'blue',
          size: 6,
        },
        line: {
          color: 'blue',
          width: 2,
        },
      },
    ];

    const errorData = [
      {
        x: _.range(1, errorFiles.length + 1),
        y: errorStats.errorCoverage,
        mode: 'lines+markers',
        type: 'scatter',
        marker: {
          color: 'red',
          size: 6,
        },
        line: {
          color: 'red',
          width: 2,
        },
      },
    ];

    const nominalLayout = {
      title: 'Nominal Test Cases Coverage',
      xaxis: {
        // type: 'log',
        title: 'Test Case Number',
        autorange: true,
      },
      yaxis: {
        // type: 'log',
        title: 'Coverage Percent',
        autorange: true,
      },
    };
    const errorLayout = {
      title: 'Error Test Cases Coverage',
      xaxis: {
        // type: 'log',
        title: 'Test Case Number',
        autorange: true,
      },
      yaxis: {
        // type: 'log',
        title: 'Error Coverage Percent',
        autorange: true,
      },
    };

    stack(nominalData, nominalLayout);
    plot(errorData, errorLayout);
  }
}

module.exports = RESTester;
