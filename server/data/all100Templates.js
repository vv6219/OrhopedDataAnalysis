const { part1Templates } = require('./orthoTemplatesPart1');
const { part2Templates } = require('./orthoTemplatesPart2');
const { part3Templates } = require('./orthoTemplatesPart3');
const { part4Templates } = require('./orthoTemplatesPart4');

const ALL_100_TEMPLATES = [
  ...part1Templates,
  ...part2Templates,
  ...part3Templates,
  ...part4Templates
];

module.exports = { ALL_100_TEMPLATES };
