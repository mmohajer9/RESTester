const SwaggerParser = require('@apidevtools/swagger-parser');

class OASTestSuite {
  constructor(path) {
    this.path = path;
    this.parser;
    this.api;
  }

  async init(resolve, reject) {
    this.parser = new SwaggerParser();
    try {
      this.api = await this.parser.validate(this.path);
      resolve(this.api);
    } catch (err) {
      reject(err);
    }
  }
}

module.exports = OASTestSuite;
