const envelope = require('./envelope');
const confirm = require('./confirm');
const delivery = require('./delivery');

module.exports = {
  ...envelope,
  ...confirm,
  ...delivery,
};
