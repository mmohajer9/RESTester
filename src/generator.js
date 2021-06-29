const _ = require('lodash');
const ODGConfigGenerator = require('./odg');

// note that in this modules we are trying to create appropriate values
// for each of these schemas because our purpose here is not mutating values
// into an erroneous values that we are going use in error test case generator

class SchemaValueGenerator extends ODGConfigGenerator {
  constructor(...props) {
    super(...props);
  }

  /**
   * @param  {} propertySchema the schema of a property or parameter which always has a type property in itself
   * @param  {} useExample default=False - if it is true, it will use examples which is included in OAS
   */
  propertySchemaValueGenerator(propertySchema, useExample = false) {
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
          result[index] = this.propertySchemaValueGenerator(
            propertySchema.items,
            useExample
          );
        }
        break;
      case 'object':
        // this will be another object nested inside the object
        result = {};
        for (const key in propertySchema.properties) {
          result[key] = this.propertySchemaValueGenerator(
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
   * @param  {} parameterType can be these three values : query , header , path , requestBody
   * @param  {} useExample default=False - if it is true, it will use examples which is included in OAS
   */
  parameterSchemaValueGenerator(
    path,
    method,
    parameterType,
    useExample = false
  ) {
    if (parameterType === 'requestBody') {
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
      const output = this.propertySchemaValueGenerator(schema, useExample);

      return output;
    } else {
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

        output[paramName] = this.propertySchemaValueGenerator(
          paramSchema,
          useExample
        );
      }

      return output;
    }
  }
}

class ResponseDictionaryTools extends SchemaValueGenerator {
  constructor(...props) {
    super(...props);

    // initialize response dictionary object on the program side
    this.responseDictionary = {};
  }

  // create or bulk update response dictionary at once
  async createResponseDictionary(object) {
    const apiName = this.api.name;
    const rdPath = config.apiResponseDictionaryPath(apiName);
    await this.createJSONFile(rdPath, object);
    this.responseDictionary = object;
    return object;
  }

  // load response dictionary from rd.json into the program
  async loadResponseDictionary() {
    const apiName = this.api.name;
    const rdPath = config.apiResponseDictionaryPath(apiName);
    const rd = await this.readJSONFile(rdPath);
    this.responseDictionary = rd;
    return rd;
  }

  // call this method after calling directory setter methods
  // it is actually making or loading response dictionary and use the methods above
  async initiateResponseDictionary() {
    const rd = await this.loadResponseDictionary();
    if (!rd) {
      const emptyRd = {};
      const { paths } = this.api;

      for (const path in paths) {
        emptyRd[path] = {
          responses: {
            get: [],
            post: [],
            put: [],
            patch: [],
            delete: [],
          },
        };
      }

      this.createResponseDictionary(emptyRd);
    }
  }

  // append an object to the given path and method related objects in response dictionary
  async addToResponseDictionary(path, method, object) {
    const rd = await this.loadResponseDictionary();
    rd[path].responses[method].push(object);
    await this.createResponseDictionary(rd);
  }

  async responseDictionaryRandomSeek(path, method) {
    const rd = await this.loadResponseDictionary();
    const responses = rd[path].responses[method];

    // if there were no responses, returns null
    if (_.isEmpty(responses)) {
      return null;
    } else {
      const randomIndex = Math.floor(Math.random() * responses.length);
      const result = responses[randomIndex];
      return result;
    }
  }
}

class SearchBasedValueGenerator extends ResponseDictionaryTools {
  findResponsePropertyValue(path, method, parameterType, property) {
    const odg = this.odgConfig;

    const odgItem = _.find(odg, (item) => item.endpoint === path);
    const methodProps = odgItem.props[method];

    if (methodProps) {
      switch (parameterType) {
        case 'requestBody':
          const { requestBody } = methodProps;
          if (_.isEmpty(requestBody)) {
            return null;
          } else {
            const candidates = requestBody[property];
            if (_.isEmpty(candidates)) {
              return null;
            } else {
              let isCandidateSelected = false;
              let candidate = {};
              while (!isCandidateSelected) {
                const randomIndex = Math.floor(
                  Math.random() * candidates.length
                );
                candidate = candidates[randomIndex];
                isCandidateSelected = this.chance.bool({
                  likelihood: candidate.likelihood,
                });
              }

              return this.responseDictionaryRandomSeek(
                candidate.path,
                candidate.method
              )[candidate.field];
            }
          }
          break;
        case 'path':
          const { urlParams } = methodProps;
          if (_.isEmpty(urlParams)) {
            return null;
          } else {
            const candidates = urlParams[property];
            if (_.isEmpty(candidates)) {
              return null;
            } else {
              let isCandidateSelected = false;
              let candidate = {};
              while (!isCandidateSelected) {
                const randomIndex = Math.floor(
                  Math.random() * candidates.length
                );
                candidate = candidates[randomIndex];
                isCandidateSelected = this.chance.bool({
                  likelihood: candidate.likelihood,
                });
              }

              return this.responseDictionaryRandomSeek(
                candidate.path,
                candidate.method
              )[candidate.field];
            }
          }
          break;
        case 'query':
          const { queryParams } = methodProps;
          if (_.isEmpty(queryParams)) {
            return null;
          } else {
            const candidates = queryParams[property];
            if (_.isEmpty(candidates)) {
              return null;
            } else {
              let isCandidateSelected = false;
              let candidate = {};
              while (!isCandidateSelected) {
                const randomIndex = Math.floor(
                  Math.random() * candidates.length
                );
                candidate = candidates[randomIndex];
                isCandidateSelected = this.chance.bool({
                  likelihood: candidate.likelihood,
                });
              }

              return this.responseDictionaryRandomSeek(
                candidate.path,
                candidate.method
              )[candidate.field];
            }
          }
          break;
        case 'header':
          const { headerParams } = methodProps;
          if (_.isEmpty(headerParams)) {
            return null;
          } else {
            const candidates = headerParams[property];
            if (_.isEmpty(candidates)) {
              return null;
            } else {
              let isCandidateSelected = false;
              let candidate = {};
              while (!isCandidateSelected) {
                const randomIndex = Math.floor(
                  Math.random() * candidates.length
                );
                candidate = candidates[randomIndex];
                isCandidateSelected = this.chance.bool({
                  likelihood: candidate.likelihood,
                });
              }

              return this.responseDictionaryRandomSeek(
                candidate.path,
                candidate.method
              )[candidate.field];
            }
          }
          break;
        default:
          break;
      }
    } else {
      return null;
    }
  }
}

module.exports = SearchBasedValueGenerator;
