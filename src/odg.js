const DepGraph = require('dependency-graph').DepGraph;
const _ = require('lodash');
const chalk = require('chalk');
const Initializer = require('./initializer');
const stringSimilarity = require('string-similarity');

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
    currentMethod,
    currentPathMethods,
    dependencies,
    currentPath,
    paths
  ) {
    // create raw result and add parameters keys
    const inputParams = this.parseParameters(currentMethod, currentPathMethods);

    if (currentPathMethods[currentMethod]) {
      // meta data that helps us to get the right dependencies among apis
      const tags = currentPathMethods[currentMethod]?.tags;

      // get keys for each parameter type
      const currentRequestBodykeys = this.objectKeysArray(
        inputParams.requestBody
      );
      const currentUrlParamskeys = this.objectKeysArray(inputParams.urlParams);
      const currentQueryParamskeys = this.objectKeysArray(
        inputParams.queryParams
      );
      const currentHeaderParamskeys = this.objectKeysArray(
        inputParams.headerParams
      );

      // logging the values
      console.log(`CURRENT : ${currentPath} >> ${currentMethod}`, tags);
      console.log(`REQUEST BODY : ${currentRequestBodykeys}`);
      console.log(`URL PARAMS : ${currentUrlParamskeys}`);
      console.log(`QUERY PARAMS : ${currentQueryParamskeys}`);
      console.log(`HEADER PARAMS : ${currentHeaderParamskeys}`);
      // searching other apis for similarities
      for (const targetPath in paths) {
        for (const targetMethod in paths[targetPath]) {
          // first take the response format of the target
          const response = this.parseResponse(paths, targetPath, targetMethod);
          // getting target tags for comparison
          const targetTags = paths[targetPath][targetMethod]?.tags;
          // do not consider current path for processing and no response apis
          if (
            (targetPath === currentPath && targetMethod === currentMethod) ||
            !response
          ) {
            continue;
          } else {
            const responseKeys = this.objectKeysArray(response);
            console.log(
              `TARGET : ${targetPath} >> ${targetMethod}`,
              responseKeys,
              targetTags
            );

            // then we should apply our similarity algorithm
            // between each parameter keys and response keys
            // but before we continue, we measure two other
            // values , tags intersection rate and url substring rate

            // reqBody of current vs Response
            // urlParams of current vs Response
            // queryParams vs Response

            if (currentRequestBodykeys) {
              // check request Body
            } else if (currentUrlParamskeys) {
              // check url params
            } else if (currentQueryParamskeys) {
              // check query params
            } else if (currentHeaderParamskeys) {
              // check header params
            }
          }
        }
      }
    }

    // this actually returns the modified inputParams with dependencies
    return inputParams;
  }

  parseParameters(currentMethod, currentPathMethods, dependencies) {
    dependencies = [];

    if (!currentPathMethods[currentMethod]) {
      return null;
    }

    const inputParams = {
      requestBody: this.onlyKeysObjectFromObject(
        currentPathMethods[currentMethod]?.requestBody?.content[
          'application/json'
        ]?.schema?.properties
      ),
      urlParams: this.onlyKeysObjectFromArray(
        currentPathMethods[currentMethod]?.parameters
          ?.filter((item) => item.in === 'path')
          ?.map((item) => item.name)
      ),
      queryParams: this.onlyKeysObjectFromArray(
        currentPathMethods[currentMethod]?.parameters
          ?.filter((item) => item.in === 'query')
          ?.map((item) => item.name)
      ),
      headerParams: this.onlyKeysObjectFromArray(
        currentPathMethods[currentMethod]?.parameters
          ?.filter((item) => item.in === 'header')
          ?.map((item) => item.name)
      ),
    };
    return inputParams;
  }

  makeSelector(fieldCoef = 0.7, tagCoef = 0.1, urlCoef = 0.2) {
    const selector = (
      fieldSimilarityRate = 0,
      commonTagsRate = 0,
      relatedURLRate = 0
    ) =>
      fieldCoef * fieldSimilarityRate +
      tagCoef * commonTagsRate +
      urlCoef * relatedURLRate;
    return selector;
  }

  commonTagsRate(tags1 = [], tags2 = []) {
    const allTags = _.union(tags1, tags2);
    const commonTags = _.intersection(tags1, tags2);

    if (allTags.length === 0 || commonTags.length === 0) {
      return 0;
    }

    return commonTags.length / allTags.length;
  }

  relatedURLRate(url1, url2) {
    const first = _.includes(url1, url2);
    const second = _.includes(url2, url1);
    if (first || second) {
      const rate = stringSimilarity.compareTwoStrings(url1, url2);
      return rate >= 50 ? rate / 100 : 0.5;
    } else {
      const rate = stringSimilarity.compareTwoStrings(url1, url2);
      return rate;
    }
  }

  parseResponse(paths, targetPath, targetMethod) {
    const objectResult =
      paths[targetPath][targetMethod]?.responses[200]?.content[
        'application/json'
      ].schema?.properties;
    const arrayResult =
      paths[targetPath][targetMethod]?.responses[200]?.content[
        'application/json'
      ].schema?.items?.properties;

    return objectResult || arrayResult;
  }

  objectKeysArray(object) {
    return object ? Object.keys(object) : null;
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
