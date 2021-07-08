const _ = require('lodash');
const TestDataGenerator = require('./generator');

class RESTesterOracle extends TestDataGenerator {
  constructor(...props) {
    super(...props);
    // http method order for testing
    this.httpMethodOrder = ['head', 'post', 'get', 'put', 'patch', 'delete'];
    this.safeMethods = ['head', 'get'];
    this.nonSafeMethods = ['post', 'put', 'patch', 'delete'];

    // initialize test case holders
    this.nominalTestCases = {
      200: [],
      400: [],
      500: [],
      invalidResponse: [],
    };
    this.errorTestCases = {
      200: [],
      400: [],
      500: [],
    };
  }

  async oracle(testCase) {
    // destructuring values
    const { path, method, testData } = testCase;
    const { data, status } = await this.makeRequest(path, method, testData);

    if (status >= 200 && status < 400) {
      await this.responseValidatorOracle(testCase, data);
    }
    await this.statusCodeOracle(testCase, status, data);
  }

  async responseValidatorOracle(testCase, responseData) {
    const { paths } = this.api;
    const { path, method } = testCase;
    // taking the expected response from specification
    const expectedResponse = this.parseResponse(paths, path, method);
    const expectedResponseKeys = this.objectKeysArray(expectedResponse);
    // for json array responses
    const actualResponse = _.isArrayLike(responseData)
      ? responseData[0]
      : responseData;
    const actualResponseKeys = this.objectKeysArray(actualResponse);

    // performing equality check between two arrays regardless of ordering
    const difference = _.difference(expectedResponseKeys, actualResponseKeys);
    const isEqual = _.isEmpty(difference);
    const isEmptyResponse = _.isEmpty(actualResponseKeys);

    if (!isEqual && !isEmptyResponse) {
      this.nominalTestCases.invalidResponse.push(testCase);
    }
  }

  async statusCodeOracle(testCase, status, responseData) {
    const { path, method } = testCase;

    if (status >= 200 && status < 400) {
      this.nominalTestCases[200].push(testCase);
      await this.addToResponseDictionary(path, method, responseData);
    } else if (status >= 400 && status < 500) {
      this.nominalTestCases[400].push(testCase);
    } else if (status >= 500) {
      this.nominalTestCases[500].push(testCase);
    }
  }

  async makeRequest(path, method, testData) {
    // creating new path variable for url parameters
    let newPath = path;

    // placing url parameters into the new refined path
    if (!_.isEmpty(testData.urlParams)) {
      for (const param in testData.urlParams) {
        const pattern = `{${param}}`;
        const replacer = new RegExp(pattern, 'g');
        newPath = newPath.replace(replacer, testData.urlParams[param]);
      }
    }

    const result = {
      data: null,
      status: null,
    };

    try {
      if (_.includes(this.safeMethods, method)) {
        const { data, status } = await this.axios[method](newPath, {
          headers: testData.headerParams,
          params: testData.queryParams,
        });

        result.data = data;
        result.status = status;
      } else {
        const { data, status } = await this.axios[method](
          newPath,
          testData.requestBody,
          {
            headers: testData.headerParams,
            params: testData.queryParams,
          }
        );
        result.data = data;
        result.status = status;
      }
    } catch (error) {
      const { status, data } = error.response;
      result.status = status;
      result.data = data;
    }

    console.log(
      `============================== TEST FOR ${path} > ${method} ==============================`
    );
    console.log(`TEST DATA : `, testData);
    console.log(`NEW PATH : `, newPath);
    console.log(`RESULT : `, result);
    return result;
  }
}

module.exports = RESTesterOracle;
