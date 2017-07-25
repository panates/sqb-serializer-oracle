/* sqb-connect-oracledb
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb-connect-oracledb/
 */

/* Internal module dependencies. */
const OracleSerializer = require('./serializer');

module.exports = {
  createSerializer(config) {
    if (config.dialect === 'oracle') {
      return new OracleSerializer(config);
    }
  }
};
