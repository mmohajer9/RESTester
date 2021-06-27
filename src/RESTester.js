const ODGConfigGenerator = require('./odg');

class SchemaValueGenerator extends ODGConfigGenerator {
  constructor(...props) {
    super(...props);
    // http method order for testing
    this.httpMethodOrder = ['head', 'post', 'get', 'put', 'patch', 'delete'];
    this.responseDictionary = {};
  }

  typeValueGenerator(property, useExample = false) {
    let result = null;
    switch (property.type) {
      case 'integer':
        useExample && property.example
          ? (result = property.example)
          : (result = this.chance.integer({ min: 1, max: 1000 }));
        break;
      case 'number':
        useExample && property.example
          ? (result = property.example)
          : (result = this.chance.floating({ min: 0, max: 100, fixed: 2 }));
        break;
      case 'string':
        useExample && property.example
          ? (result = property.example)
          : (result = `${this.chance.animal()} ${this.chance.name()}`);
        break;
      case 'boolean':
        useExample && property.example
          ? (result = property.example)
          : (result = this.chance.bool());
        break;
      case 'array':
        // this will be another array nested inside the object
        result = [];
        for (
          let index = 0;
          index < this.chance.integer({ min: 0, max: 10 });
          index++
        ) {
          result[index] = this.typeValueGenerator(property.items, useExample);
        }
        break;
      case 'object':
        // this will be another object nested inside the object
        result = {};
        for (const key in property.properties) {
          result[key] = this.typeValueGenerator(
            property.properties[key],
            useExample
          );
        }
        break;
      default:
        break;
    }

    const defaultItem = property.default;
    const enumItems = property.enum;

    // pick default value if default value was available with the chance of 50%
    if (defaultItem && this.chance.bool()) {
      result = defaultItem;
    }

    // pick a random element from enum items if enum items were available
    if (enumItems) {
      result = enumItems[Math.floor(Math.random() * enumItems.length)];
    }

    return result;
  }
  // generate a request body object
  requestBodySchemaValueGenerator(
    apiPath,
    method,
    contentType,
    useExample = false
  ) {
    const requestBody = this.api.paths[apiPath]?.[method]?.requestBody;
    if (!requestBody) {
      // if the api path for the given method does not have the request body,
      // the generated request body should be empty
      return {};
    }

    const requestBodyRequired = requestBody.required;
    // generate empty request with likelihood of 20%
    if (!requestBodyRequired) {
      const useEmptyRequestBody = this.chance.bool({ likelihood: 20 });
      if (useEmptyRequestBody) {
        return {};
      }
    }
    // request body schema
    const schema = requestBody.content[contentType]?.schema;

    // these variables has not been used yet
    const schemaRequiredFields = schema.required;

    // type of schema
    const schemaType = schema.type;

    // generated output
    let output = {};

    if (schemaType === 'object') {
      // request body properties for the given schema
      output = this.typeValueGenerator(schema, useExample);
    } else if (schemaType === 'array') {
      output = this.typeValueGenerator(schema, useExample);
    }

    return output;
  }
  // generate query param object
  queryParamSchemaGenerator(apiPath, method, useExample = false) {
    const parameters = this.api.paths[apiPath]?.[method]?.parameters;

    if (!parameters) {
      // no parameters is specified
      return {};
    }
    const output = {};

    const queryParams = parameters.filter((param) => param.in === 'query');

    for (const param of queryParams) {
      if (!param.required) {
        const useEmptyParam = this.chance.bool({ likelihood: 20 });
        if (useEmptyParam && param.schema.default) {
          return { [param.name]: param.schema.default };
        }
      }
      output[param.name] = this.typeValueGenerator(param.schema, useExample);
    }

    return output;
  }
  // generate header param object
  headerParamSchemaGenerator(apiPath, method, useExample = false) {
    const parameters = this.api.paths[apiPath]?.[method]?.parameters;

    if (!parameters) {
      // no parameters is specified
      return {};
    }
    const output = {};

    const headerParams = parameters.filter((param) => param.in === 'header');

    for (const param of headerParams) {
      if (!param.required) {
        const useEmptyParam = this.chance.bool({ likelihood: 20 });
        if (useEmptyParam) {
          return {};
        }
      }
      output[param.name] = this.typeValueGenerator(param.schema, useExample);
    }

    return output;
  }
  // generate URL parameter value
  URLParamSchemaGenerator(apiPath, method, useExample = false) {
    const parameters = this.api.paths[apiPath]?.[method]?.parameters;

    if (!parameters) {
      // no parameters is specified
      return {};
    }
    const output = {};

    const pathParams = parameters.filter((param) => param.in === 'path');

    for (const param of pathParams) {
      if (!param.required) {
        const useEmptyParam = this.chance.bool({ likelihood: 20 });
        if (useEmptyParam) {
          return {};
        }
      }
      output[param.name] = this.typeValueGenerator(param.schema, useExample);
    }

    return output;
  }
}

class BaseRESTester extends SchemaValueGenerator {
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

class RESTester extends BaseRESTester {
  // set api call order based on dependecies in odg.json
  setApiCallOrder() {
    // first we justify how to call the api in the correct order
    try {
      const odgConfig = require(this.odgConfPath);

      odgConfig.forEach((element) => {
        this.graph.addNode(element.endpoint, element.derivedProps);
      });
      odgConfig.forEach((element) => {
        if (!_.isEmpty(element.dependsOn)) {
          element.dependsOn.forEach((dependencyEndpoint) => {
            this.graph.addDependency(element.endpoint, dependencyEndpoint);
          });
        }
      });
      this.apiCallOrder = this.graph.overallOrder();
      this.odgConfig = odgConfig;
      console.log(chalk.cyan('API Call Order Has Been Set'));
    } catch (error) {
      console.log(chalk.redBright('No ODG Configuration Has Been Provided'));
      console.log(chalk.yellowBright('Check ODG Config Directory'));
      return;
    }
  }
}

module.exports = RESTester;
