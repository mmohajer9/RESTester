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

  odgEntry(path, paths, smart = false) {
    const parser = smart
      ? this.smartParseParameters.bind(this)
      : this.parseParameters.bind(this);
    const entry = {
      endpoint: path,
      dependsOn: [],
      props: {
        head: parser('head', paths[path]),
        get: parser('get', paths[path]),
        post: parser('post', paths[path]),
        put: parser('put', paths[path]),
        patch: parser('patch', paths[path]),
        delete: parser('delete', paths[path]),
      },
    };
    return entry;
  }

  smartParseParameters(methodName, methods) {
    return 'smart parsers has not completed yet';
  }

  parseParameters(methodName, methods) {
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
  /**
   * @param  {boolean} smart
   * create odg entries for odg.json
   * null value will be inserted for the parameters
   * who were not on the open api specification file
   * and when smart is true it tries to find data dependencies between
   * different api paths of the specification unless it generate emtpy values
   * by default smart is false
   */
  async createODG(smart = false) {
    const paths = this.api.paths;
    const result = [];
    for (const path in paths) {
      result.push(this.odgEntry(path, paths, smart));
    }
    // create JSON Config File
    await this.createJSONFile(this.odgConfPath, result);
    console.log(chalk.blueBright('ODG Configuration Has Been Created'));
  }
}

module.exports = ODGConfigGenerator;
