const ODGConfigGenerator = require('./odg');

class SchemaValueGenerator extends ODGConfigGenerator {
  constructor(...props) {
    super(...props);
    // http method order for testing
    this.httpMethodOrder = ['head', 'post', 'get', 'put', 'patch', 'delete'];
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
    path,
    method,
    useExample = false,
    contentType = 'application/json'
  ) {
    // if the api path for the given method does not have the request body,
    // the generated request body should be empty
    const requestBody = this.api.paths[path]?.[method]?.requestBody;
    if (!requestBody) {
      return {};
    }

    // check for request body required, if it is, then we should generate one absolutely
    const requestBodyRequired = requestBody.required;
    // if it is not required, then we can use both empty and non-empty request body
    // so we decide with a probability of 20% to choose between these two options
    if (!requestBodyRequired) {
      const useEmptyRequestBody = this.chance.bool({ likelihood: 20 });
      if (useEmptyRequestBody) {
        return {};
      }
    }

    // request body schema
    const schema = requestBody.content[contentType]?.schema;

    // generated output
    const output = this.typeValueGenerator(schema, useExample);

    return output;
  }

  // generate query param object
  queryParamSchemaGenerator(path, method, useExample = false) {
    // if the api path for the given method does not have query parameter,
    // the generated query parameter should be empty
    const parameters = this.api.paths[path]?.[method]?.parameters;
    if (!parameters) {
      // no parameters is specified
      return {};
    }

    const output = {};

    const queryParams = parameters.filter((param) => param.in === 'query');

    for (const param of queryParams) {
      const paramRequired = param.required;
      const paramName = param.name;

      if (!paramRequired) {
        // check for empty param
        const useEmptyParam = this.chance.bool({ likelihood: 20 });
        if (useEmptyParam) {
          return {};
        }
        // check for default param
        const useDefaultParam = this.chance.bool({ likelihood: 40 });
        if (useDefaultParam) {
          return { [paramName]: param.schema.default };
        }
      }
      output[param.name] = this.typeValueGenerator(param.schema, useExample);
    }

    return output;
  }

  // generate header param object
  headerParamSchemaGenerator(path, method, useExample = false) {
    const parameters = this.api.paths[path]?.[method]?.parameters;

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
  URLParamSchemaGenerator(path, method, useExample = false) {
    const parameters = this.api.paths[path]?.[method]?.parameters;

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

class SearchBasedValueGenerator extends SchemaValueGenerator {}

class TestDataGenerator extends SearchBasedValueGenerator {}

module.exports = TestDataGenerator;
