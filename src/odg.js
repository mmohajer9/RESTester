const DepGraph = require('dependency-graph').DepGraph;
const _ = require('lodash');
const chalk = require('chalk');
const Initializer = require('./initializer');

class ODGInitializer extends Initializer {
  constructor(...props) {
    super(...props);
    // initialize a operation dependency graph (empty)
    this.graph = new DepGraph();
  }

  odgEntry(path, paths) {
    const entry = {
      endpoint: path,
      dependsOn: [],
      props: {
        head: this.parseMethodProps('head', paths[path]),
        get: this.parseMethodProps('get', paths[path]),
        post: this.parseMethodProps('post', paths[path]),
        put: this.parseMethodProps('put', paths[path]),
        patch: this.parseMethodProps('patch', paths[path]),
        delete: this.parseMethodProps('delete', paths[path]),
      },
    };
    return entry;
  }

  parseMethodProps(methodName, methods) {
    const result = {
      requestBody: this.onlyKeysObject(
        methods[methodName]?.requestBody?.content['application/json']?.schema
          ?.properties
      ),
      urlParams: this.onlyKeysObjectFromArray(
        methods[methodName]?.parameters
          ?.filter((item) => item.in === 'path')
          ?.map((item) => item.name)
      ),
      queryParams: this.onlyKeysObjectFromArray(
        methods[methodName]?.parameters
          ?.filter((item) => item.in === 'query')
          ?.map((item) => item.name)
      ),
      headerParams: this.onlyKeysObjectFromArray(
        methods[methodName]?.parameters
          ?.filter((item) => item.in === 'header')
          ?.map((item) => item.name)
      ),
    };

    return result;
  }

  onlyKeysObject(object) {
    try {
      const newObject = {};
      const keysArray = Object.keys(object);
      for (const key of keysArray) {
        newObject[key] = '';
      }
      return newObject;
    } catch (error) {
      return null;
    }
  }

  onlyKeysObjectFromArray(array) {
    if (_.isEmpty(array)) {
      return null;
    }
    try {
      const newObject = {};
      const keysArray = array;
      for (const key of keysArray) {
        newObject[key] = '';
      }
      return newObject;
    } catch (error) {
      return null;
    }
  }
}

class ODGConfigGenerator extends ODGInitializer {
  createODG() {
    //TODO creating odg.json config
  }
  createRawODG() {
    const paths = this.api.paths;
    const result = [];
    for (const path in paths) {
      result.push(this.odgEntry(path, paths));
    }
    // create JSON Config File
    this.createJSONFile(this.odgConfPath, result);
  }
}

module.exports = ODGConfigGenerator;
