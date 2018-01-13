/* sqb-serializer-oracle
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb-serializer-oracle/
 */

/* Internal module dependencies. */
const OracleSerializer = require('./serializer');

module.exports = {
  createSerializer: function(config) {
    /* istanbul ignore else */
    if (config.dialect === 'oracle') {
      return new OracleSerializer(config);
    }
  }
};
