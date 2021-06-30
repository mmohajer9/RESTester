const SwaggerParser = require('@apidevtools/swagger-parser');
const chalk = require('chalk');
const util = require('util');
const fse = require('fs-extra');
const ejs = require('ejs');
const pathModule = require('path');
const _ = require('lodash');
const getAxiosInstance = require('./axios');

class Initializer {
  constructor(mainProgram) {
    // initializing fields
    this.oasConfPath = config.oasConfPath;
    this.odgConfPath = config.odgConfPath;

    // attaching main program
    this.mainProgram = mainProgram;

    // initialize resolver/rejecter
    this.resolveHandler = config.resolveHandler;
    this.rejectHandler = config.rejectHandler;

    // will be initialized later
    this.parser = {};
    this.api = {};
    this.odgConfig = {};
    this.apiCallOrder = [];
    this.httpMethodOrder = [];
    this.graph = {};
    this.chance = {};
    this.axios = {};

    // initializing parser and validator
    this.#init();
  }

  async #init() {
    await this.#initParser(this.resolveHandler, this.rejectHandler);

    // set api name
    this.setApiName();

    // call main callback
    this.mainProgram ? this.mainProgram(this) : null;
  }

  async #initParser(resolve, reject) {
    this.parser = new SwaggerParser();
    try {
      this.api = await this.parser.validate(this.oasConfPath);
      console.log(
        chalk.green('Open API Specification has been validated and parsed')
      );
    } catch (err) {
      err ? reject(err) : null;
    }
  }

  // general purpose methods for further usages

  show(depth) {
    this.inspect(this, depth);
  }

  showProperty(property, depth) {
    this.inspect(this[property], depth);
  }

  print(depth) {
    this.inspect(this.api, depth);
  }

  printProperty(property, depth) {
    this.inspect(this.api[property], depth);
  }

  inspect(obj, depth) {
    const inspected = util.inspect(obj, false, depth, true);
    console.log(inspected);
  }

  async createJSONFile(path, object) {
    try {
      await fse.ensureFile(path);
      await fse.writeJson(path, object, {
        spaces: 2,
        EOL: '\r\n',
      });
    } catch (err) {
      // this.rejectHandler(err);
    }
  }

  async readJSONFile(path) {
    try {
      const object = await fse.readJson(path);
      return object;
    } catch (error) {
      // this.rejectHandler(error);
      return null;
    }
  }

  async renderTemplateToFile(
    apiName,
    templateName,
    context,
    outputDir,
    outputName
  ) {
    const templatePath = config.apiTempatePath(apiName, templateName);
    const fileContent = await ejs.renderFile(templatePath, context);
    const outputPath = pathModule.join(outputDir, outputName);
    await fse.ensureFile(outputPath);
    await fse.outputFile(outputPath, fileContent);
  }

  async initiateOutputDirectories() {
    const apiName = this.api.name;

    const testsDir = config.testsDir;
    const logsDir = config.logsDir;
    const oasConfDir = config.oasConfDir;
    const odgConfDir = config.odgConfDir;

    const apiTestsDir = config.apiTestsDir(apiName);
    const apiCommonDir = config.apiCommonDir(apiName);
    const apiTemplatesDir = config.apiTemplatesDir(apiName);
    const apiErrorTestCasesDir = config.apiErrorTestCasesDir(apiName);
    const apiNominalTestCasesDir = config.apiNominalTestCasesDir(apiName);

    const apiNominalJsonTestCasesDir =
      config.apiNominalJsonTestCasesDir(apiName);
    const apiNominalJestTestCasesDir =
      config.apiNominalJestTestCasesDir(apiName);
    const apiNominalJsTestCasesDir = config.apiNominalJsTestCasesDir(apiName);
    const apiErrorJsonTestCasesDir = config.apiErrorJsonTestCasesDir(apiName);
    const apiErrorJestTestCasesDir = config.apiErrorJestTestCasesDir(apiName);
    const apiErrorJsTestCasesDir = config.apiErrorJsTestCasesDir(apiName);

    const allDirs = [
      testsDir,
      logsDir,
      oasConfDir,
      odgConfDir,
      apiTestsDir,
      apiCommonDir,
      apiTemplatesDir,
      apiErrorTestCasesDir,
      apiNominalTestCasesDir,
      apiNominalJsonTestCasesDir,
      apiNominalJestTestCasesDir,
      apiNominalJsTestCasesDir,
      apiErrorJsonTestCasesDir,
      apiErrorJestTestCasesDir,
      apiErrorJsTestCasesDir,
    ];

    allDirs.forEach(async (dir) => {
      await fse.ensureDir(dir);
    });
  }

  setApiName() {
    const { title, version } = this.api.info;
    const apiName = _.kebabCase(`${title}-version${version}`);
    this.api.name = apiName;
  }

  setRequestHandler() {
    const { servers } = this.api;
    const baseURL = servers[0].url;

    this.axios = getAxiosInstance(baseURL);
  }
}

module.exports = Initializer;
