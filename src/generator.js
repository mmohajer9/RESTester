const ODGConfigGenerator = require('./odg');

// note that in this modules we are trying to create appropriate values
// for each of these schemas because our purpose here is not mutating values
// into an erroneous values that we are going use in error test case generator

class SchemaValueGenerator extends ODGConfigGenerator {
  constructor(...props) {
    super(...props);
    // http method order for testing
    this.httpMethodOrder = ['head', 'post', 'get', 'put', 'patch', 'delete'];
  }

  /**
   * @param  {} propertySchema the schema of a property or parameter which always has a type property in itself
   * @param  {} useExample default=False - if it is true, it will use examples which is included in OAS
   */
  schemaTypeValueGenerator(propertySchema, useExample = false) {
    let result = null;
    switch (propertySchema.type) {
      case 'integer':
        useExample && propertySchema.example
          ? (result = propertySchema.example)
          : (result = this.chance.integer({ min: 1, max: 1000 }));
        break;
      case 'number':
        useExample && propertySchema.example
          ? (result = propertySchema.example)
          : (result = this.chance.floating({ min: 0, max: 100, fixed: 2 }));
        break;
      case 'string':
        useExample && propertySchema.example
          ? (result = propertySchema.example)
          : (result = `${this.chance.animal()} ${this.chance.name()}`);
        break;
      case 'boolean':
        useExample && propertySchema.example
          ? (result = propertySchema.example)
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
          result[index] = this.schemaValueGenerator(
            propertySchema.items,
            useExample
          );
        }
        break;
      case 'object':
        // this will be another object nested inside the object
        result = {};
        for (const key in propertySchema.properties) {
          result[key] = this.schemaValueGenerator(
            propertySchema.properties[key],
            useExample
          );
        }
        break;
      default:
        break;
    }

    // check for available properties for default and a chance for selection
    const defaultItem = propertySchema.default;
    const useDefaultItem = this.chance.bool();

    // pick default value if default value was available with the chance of 50%
    if (defaultItem && useDefaultItem) {
      result = defaultItem;
    }

    // check for available properties for enum
    const enumItems = propertySchema.enum;

    // pick a random element from enum items if enum items were available
    if (enumItems) {
      const randomIndex = Math.floor(Math.random() * enumItems.length);
      result = enumItems[randomIndex];
    }

    return result;
  }

  /**
   * @param  {} path the actual path of the api that you want to create its value
   * @param  {} method can be : head , get , put , patch , post , delete for the correspondent api
   * @param  {} useExample default=False - if it is true, it will use examples which is included in OAS
   */
  requestBodySchemaValueGenerator(path, method, useExample = false) {
    // if the api path for the given method does not have the request body,
    // the generated request body should be empty
    const requestBody = this.api.paths[path]?.[method]?.requestBody;
    if (!requestBody) {
      return {};
    }

    // check for request body required, if it is, then we should generate one absolutely
    const requestBodyRequired = requestBody.required;
    const useEmptyRequestBody = this.chance.bool({ likelihood: 20 });

    // if it is not required, then we can use both empty and non-empty request body
    // so we decide with a probability of 20% to choose between these two options
    if (!requestBodyRequired && useEmptyRequestBody) {
      return {};
    }

    // request body schema
    const schema = requestBody.content['application/json']?.schema;

    // generated output
    const output = this.schemaValueGenerator(schema, useExample);

    return output;
  }

  /**
   * @param  {} path the actual path of the api that you want to create its value
   * @param  {} method can be : head , get , put , patch , post , delete for the correspondent api
   * @param  {} parameterType can be these three values : query , header , path
   * @param  {} useExample default=False - if it is true, it will use examples which is included in OAS
   */
  parameterTypeSchemaValueGenerator(
    path,
    method,
    parameterType,
    useExample = false
  ) {
    // output object which is returned in the end of the method call
    const output = {};

    // if the api path for the given method does not have query parameter,
    // the generated query parameter should be empty
    const parameters = this.api.paths[path]?.[method]?.parameters;
    if (!parameters) {
      // no parameters is specified
      return {};
    }

    // filtering all parameters to only get all query params
    const queryParams = parameters.filter(
      (param) => param.in === parameterType
    );

    // for each param we will check whether it is requored or not.
    // if it is not required, then we try to complete the operation with empty param
    // otherwise we check for default value, if it is available we will use it with
    // a chance of 40% if it is not, then we will generate a new value based on its schema
    for (const param of queryParams) {
      // check for parameter name
      const paramName = param.name;

      // check for parameter schema
      const paramSchema = param.schema;

      // check wheter it is required or not
      const paramRequired = param.required;
      const useEmptyParam = this.chance.bool({ likelihood: 20 });

      if (!paramRequired && useEmptyParam) {
        return {};
      }

      output[paramName] = this.schemaValueGenerator(paramSchema, useExample);
    }

    return output;
  }
}

class ResponseDictionaryTools extends SchemaValueGenerator {
  constructor(...props) {
    super(...props);

    this.responseDictionary = {};
  }

  async createResponseDictionary(object) {
    const apiName = this.api.name;
    const rdPath = config.apiResponseDictionaryPath(apiName);
    await this.createJSONFile(rdPath, object);
    this.responseDictionary = object;
    return object;
  }

  async loadResponseDictionary() {
    const apiName = this.api.name;
    const rdPath = config.apiResponseDictionaryPath(apiName);
    const rd = await this.readJSONFile(rdPath);
    this.responseDictionary = rd;
    return rd;
  }

  async addToResponseDictionary(object) {
    const rd = await this.loadResponseDictionary();
    const newObject = {
      ...rd,
      ...object,
    };
    await this.createResponseDictionary(newObject);
  }

  async initiateResponseDictionary() {
    const rd = await this.loadResponseDictionary();
    if (!rd) {
      const emptyRd = {};

      this.createResponseDictionary(emptyRd);
    }
  }
}

class SearchBasedValueGenerator extends ResponseDictionaryTools {}

module.exports = SearchBasedValueGenerator;
