const SwaggerParser = require('@apidevtools/swagger-parser');
const chalk = require('chalk');
const util = require('util');
const fse = require('fs-extra');
const jf = require('jsonfile');
const ejs = require('ejs');
const pathModule = require('path');

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

    // metadata placeholder
    this.openApiVersion = '';
    this.apiInfo = {};
    this.servers = [];

    // initializing parser and validator
    this.#init();
  }

  async #init() {
    await this.#initParser(this.resolveHandler, this.rejectHandler);
    // fetch metadatas
    this.servers = this.api.servers;
    this.openApiVersion = this.api.openapi;
    this.apiInfo = this.api.info;
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

  print(depth) {
    const inspected = util.inspect(this.api, false, depth, true);
    console.log(inspected);
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
}

module.exports = Initializer;
