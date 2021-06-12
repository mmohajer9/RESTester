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
    // first flush all dependencies for the new entry
    const dependencies = [];
    const parser = smart
      ? this.smartParseParameters.bind(this)
      : this.parseParameters.bind(this);
    const entry = {
      endpoint: path,
      dependsOn: dependencies,
      props: {
        head: parser('head', paths[path], dependencies, path, paths),
        get: parser('get', paths[path], dependencies, path, paths),
        post: parser('post', paths[path], dependencies, path, paths),
        put: parser('put', paths[path], dependencies, path, paths),
        patch: parser('patch', paths[path], dependencies, path, paths),
        delete: parser('delete', paths[path], dependencies, path, paths),
      },
    };
    return entry;
  }

  smartParseParameters(
    currentMethodName,
    currentPathMethods,
    dependencies,
    currentPath,
    paths
  ) {
    // create raw result and add parameters keys
    const inputParams = this.parseParameters(
      currentMethodName,
      currentPathMethods
    );

    if (currentPathMethods[currentMethodName]) {
      // meta data that helps us to get the right dependencies among apis
      const tags = currentPathMethods[currentMethodName]?.tags;
      const operationId = currentPathMethods[currentMethodName]?.operationId;
      const keys = Object.keys(inputParams);

      // logging the values
      console.log(
        `${currentPath} >> ${currentMethodName}`,
        tags,
        operationId,
        keys
      );

      // searching other apis for similarities
      for (const path in paths) {
        // not considering the current path
        if (path === currentPath) {
          continue;
        }
        //TODO **Complete This Part** ---> processing the other paths
      }
    }

    // this actually returns the modified inputParams with dependencies
    return inputParams;
  }

  parseParameters(currentMethodName, currentPathMethods, dependencies) {
    dependencies = [];

    if (!currentPathMethods[currentMethodName]) {
      return null;
    }

    const inputParams = {
      requestBody: this.onlyKeysObjectFromObject(
        currentPathMethods[currentMethodName]?.requestBody?.content[
          'application/json'
        ]?.schema?.properties
      ),
      urlParams: this.onlyKeysObjectFromArray(
        currentPathMethods[currentMethodName]?.parameters
          ?.filter((item) => item.in === 'path')
          ?.map((item) => item.name)
      ),
      queryParams: this.onlyKeysObjectFromArray(
        currentPathMethods[currentMethodName]?.parameters
          ?.filter((item) => item.in === 'query')
          ?.map((item) => item.name)
      ),
      headerParams: this.onlyKeysObjectFromArray(
        currentPathMethods[currentMethodName]?.parameters
          ?.filter((item) => item.in === 'header')
          ?.map((item) => item.name)
      ),
    };
    return inputParams;
  }

  onlyKeysObjectFromObject(object) {
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
