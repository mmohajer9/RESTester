const DepGraph = require('dependency-graph').DepGraph;
const _ = require('lodash');
const chalk = require('chalk');
const Initializer = require('./initializer');
const stringSimilarity = require('string-similarity');
const Chance = require('chance');
const pathModule = require('path');

class ODGInitializer extends Initializer {
  constructor(...props) {
    super(...props);
    // initialize a operation dependency graph (empty)
    this.graph = new DepGraph();
    this.chance = new Chance();
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
      const currentTags = currentPathMethods[currentMethod]?.tags;

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

      const paramsKeys = {
        requestBody: currentRequestBodykeys,
        urlParams: currentUrlParamskeys,
        queryParams: currentQueryParamskeys,
        headerParams: currentHeaderParamskeys,
      };

      //* logging the values
      // console.log(`CURRENT : ${currentPath} >> ${currentMethod}`, currentTags);
      // console.log(`REQUEST BODY : ${currentRequestBodykeys}`);
      // console.log(`URL PARAMS : ${currentUrlParamskeys}`);
      // console.log(`QUERY PARAMS : ${currentQueryParamskeys}`);
      // console.log(`HEADER PARAMS : ${currentHeaderParamskeys}`);

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
            !response ||
            targetMethod !== 'get'
          ) {
            continue;
          } else {
            const responseKeys = this.objectKeysArray(response);

            //* logging the values
            // console.log(
            //   `TARGET : ${targetPath} >> ${targetMethod}`,
            //   responseKeys,
            //   targetTags
            // );

            // then we should apply our similarity algorithm
            // between each parameter keys and response keys
            // but before we continue, we measure two other
            // values , tags intersection rate and url substring rate

            const commonTagsRate = this.commonTagsRate(currentTags, targetTags);
            const relatedURLRate = this.relatedURLRate(currentPath, targetPath);

            // creating a selector function
            const selector = this.makeSelector(0.1, 0.4, 0.3);

            for (const paramName in paramsKeys) {
              if (paramsKeys[paramName]) {
                for (const field of paramsKeys[paramName]) {
                  const { target, rating } = this.fieldSimilarityRate(
                    field,
                    responseKeys
                  );
                  const selectionRate = selector(
                    rating,
                    commonTagsRate,
                    relatedURLRate
                  );
                  const selectionRatePercent = +(selectionRate * 100).toFixed(
                    2
                  );
                  const selected = this.chance.bool({
                    likelihood: selectionRatePercent,
                  });
                  // console.log(
                  //   'SELECTION RATE : ',
                  //   selectionRate,
                  //   'SELECTED ? :',
                  //   selected
                  // );
                  if (selected) {
                    // adding dependency path to the list
                    dependencies.push(targetPath);
                    const duplicateFreeDependencies = _.uniq(dependencies);
                    _.remove(dependencies, () => true);
                    dependencies.push(...duplicateFreeDependencies);

                    // adding dependency details
                    inputParams[paramName][field].push({
                      path: targetPath,
                      method: targetMethod,
                      field: target,
                      likelihood: selectionRatePercent,
                    });
                  }
                }
              }
            }
          }
        }
      }
    }

    // this actually returns the modified inputParams with dependencies
    return inputParams;
  }

  parseParameters(currentMethod, currentPathMethods, dependencies) {
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
    ) => {
      //* logging the values
      // console.log('---------------------------------------------');
      // console.log('FIELD SIMILARITY : ', fieldSimilarityRate);
      // console.log('COMMON TAGS : ', commonTagsRate);
      // console.log('RELATED URL : ', relatedURLRate);
      const totalRate =
        fieldCoef * fieldSimilarityRate +
        tagCoef * commonTagsRate +
        urlCoef * relatedURLRate;
      return totalRate;
    };
    return selector;
  }

  fieldSimilarityRate(inputField, responseFields) {
    const { bestMatch } = stringSimilarity.findBestMatch(
      inputField,
      responseFields
    );

    return bestMatch;
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
      paths[targetPath][targetMethod]?.responses?.[200]?.content?.[
        'application/json'
      ]?.schema?.properties;
    const arrayResult =
      paths[targetPath][targetMethod]?.responses?.[200]?.content?.[
        'application/json'
      ]?.schema?.items?.properties;

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
        newObject[key] = [];
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
        newObject[key] = [];
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
    if (this.outputDir) {
      const outputPath = pathModule.join(this.outputDir, 'odg.json');
      await this.createJSONFile(outputPath, result);
    }
    console.log(chalk.blueBright('ODG Configuration Has Been Created'));
  }

  // set api call order based on dependecies in odg.json
  async setApiCallOrder() {
    // first we justify how to call the api in the correct order

    let odgConfig = {};
    const visitedPaths = [];

    try {
      odgConfig = await this.readJSONFile(this.odgConfPath);
    } catch (error) {
      console.log(error);
      console.log(chalk.redBright('No ODG Configuration Has Been Provided'));
      console.log(chalk.yellowBright('Check ODG Config Directory'));
      return;
    }

    // adding nodes to the graph + props corresponding to each node
    odgConfig.forEach(({ endpoint, props, dependsOn }) => {
      this.graph.addNode(endpoint, { props, depCount: dependsOn.length });
    });

    // adding dependencies + checking for cycles
    odgConfig.forEach(({ endpoint, dependsOn }) => {
      if (!_.includes(visitedPaths, endpoint)) {
        visitedPaths.push(endpoint);
      }
      if (!_.isEmpty(dependsOn)) {
        dependsOn.forEach((dependencyEndpoint) => {
          if (!_.includes(visitedPaths, dependencyEndpoint)) {
            this.graph.addDependency(endpoint, dependencyEndpoint);
          }
        });
      }
    });
    this.apiCallOrder = this.graph.overallOrder();
    this.odgConfig = odgConfig;
    console.log(chalk.cyan('API Call Order Has Been Set'));
  }
}

module.exports = ODGConfigGenerator;
