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
    } catch (error) {
      console.log(chalk.redBright('No ODG Configuration Has Been Provided'));
      console.log(chalk.yellowBright('Check ODG Config Directory'));
      return;
    }
  }
}

class ODGConfigGenerator extends ODGInitializer {
  createODG() {
    //TODO creating odg.json config
    // in the end, we calculate the order of api calls
    this.setApiCallOrder();
  }
  createRawODG() {
    //TODO creating raw (empty) odg.json config
    // in the end, we calculate the order of api calls
    this.setApiCallOrder();
  }

  // FIXME: fix the following functions and convert them into the top ones

  // enerate raw ODG config which has no selected dependencies
  async generateRawODGConfig() {
    const file = this.odgConfPath;
    const configs = [];

    for (const item in this.api.paths) {
      configs.push({
        endpoint: item,
        dependsOn: [],
        derivedProps: {
          head: this.getMethodProps(item, 'head'),
          post: this.getMethodProps(item, 'post'),
          get: this.getMethodProps(item, 'get'),
          put: this.getMethodProps(item, 'put'),
          patch: this.getMethodProps(item, 'patch'),
          delete: this.getMethodProps(item, 'delete'),
        },
      });
    }

    try {
      await jf.writeFile(file, configs, { spaces: 2, EOL: '\r\n' });
    } catch (err) {
      this.rejectHandler(err);
    }
  }

  // helper methods which were used in other methods
  getMethodProps(path, method) {
    const reqBodyToKeyMapping = (inObj) => {
      const retObj = {};
      for (const key in inObj) {
        retObj[key] = '';
      }
      return inObj ? retObj : null;
    };

    const props = {
      requestBody: reqBodyToKeyMapping(
        this.getJsonRequestBodyProperties(path, method)
      ),
      urlParams: this.getUrlParams(path, method),
      queryParams: this.getQueryParams(path, method),
      headerParams: this.getHeaderParams(path, method),
    };
    return this.api.paths[path]?.[method] ? props : null;
  }

  getJsonRequestBodyProperties(path, method) {
    return this.api.paths[path]?.[method]?.requestBody?.content[
      'application/json'
    ]?.schema?.properties;
  }

  getUrlParams(path, method) {
    const params = this.api.paths[path]?.[method]?.parameters
      ?.filter((param) => param.in === 'path')
      .map((param) => param.name);

    if (_.isEmpty(params)) {
      return null;
    } else {
      const retObj = {};
      params.forEach((element) => {
        retObj[element] = '';
      });
      return retObj;
    }
  }

  getQueryParams(path, method) {
    const params = this.api.paths[path]?.[method]?.parameters
      ?.filter((param) => param.in === 'query')
      .map((param) => param.name);

    if (_.isEmpty(params)) {
      return null;
    } else {
      const retObj = {};
      params.forEach((element) => {
        retObj[element] = '';
      });
      return retObj;
    }
  }

  getHeaderParams(path, method) {
    const params = this.api.paths[path]?.[method]?.parameters
      ?.filter((param) => param.in === 'header')
      .map((param) => param.name);

    if (_.isEmpty(params)) {
      return null;
    } else {
      const retObj = {};
      params.forEach((element) => {
        retObj[element] = '';
      });
      return retObj;
    }
  }
}

module.exports = ODGConfigGenerator;
