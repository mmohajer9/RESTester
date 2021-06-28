const SwaggerParser = require('@apidevtools/swagger-parser');
const chalk = require('chalk');
const util = require('util');
const fse = require('fs-extra');
const jf = require('jsonfile');
const ejs = require('ejs');
const pathModule = require('path');
const _ = require('lodash');

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
      await jf.writeFile(path, object, {
        spaces: 2,
        EOL: '\r\n',
      });
    } catch (err) {
      this.rejectHandler(err);
    }
  }

  async readJSONFile(path) {
    try {
      const object = await jf.readFile(path);
      return object;
    } catch (error) {
      this.rejectHandler(err);
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

  setApiName() {
    const { title, version } = this.api.info;
    const apiName = _.kebabCase(`${title}-version${version}`);
    this.api.name = apiName;
  }
}

module.exports = Initializer;
