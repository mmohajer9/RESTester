const argv = process.argv.splice(2);
const OASTestSuite = require('./oas');

const oas = new OASTestSuite(argv[0]);

oas.init(console.log, (err) => {
  console.error('error : ', err);
});
