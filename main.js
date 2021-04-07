const argv = process.argv.splice(2);
const OAS = require('./oas');

const oas = new OAS(argv[0]);

oas.init(console.log , console.error);
