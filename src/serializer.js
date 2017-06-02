/* SQB Oracle Serializer Plugin
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* External module dependencies. */
const {Serializer} = require('sqb');

class OracleSerializer extends Serializer {

  constructor(config) {
    super(config);
    this.dialect = 'oracle';
    this.reservedWords = this.reservedWords.concat(['comment', 'dual']);
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   * @override
   */
  _serializeSelect(obj) {
    let sql = super._serializeSelect(obj);
    const prettyPrint = this.prettyPrint;
    const limit = obj._limit;
    const offset = obj._offset;
    if (limit || offset) {
      sql =
          'select ' + (obj._alias ? obj._alias + '.' : '') +
          '* from (select rownum row$number, t.* from (' +
          (prettyPrint ? '\n  ' : '') +
          sql +
          (prettyPrint ? '\n' : '') +
          ') t)' + (obj._alias ? ' ' + obj._alias : '') +
          (prettyPrint ? '\nwhere' : ' where') +
          (offset ? ' row$number >= ' + offset : '') +
          (limit ? (offset ? ' and' : '') + ' row$number <= ' +
              (limit + (offset || 0)) : '');
    }
    return sql;
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   * @override
   */
  _serializeTablesNames(tables) {
    return super._serializeTablesNames(tables) || 'dual';
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   * @override
   */
  _serializeCondition(item) {
    let s = super._serializeCondition(item);
    if (!item.isRaw) {
      s = s.replace(/!= ?null/g, 'is not null')
          .replace(/<> ?null/g, 'is not null')
          .replace(/= ?null/g, 'is null');
    }
    return s;
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   * @override
   */
  _serializeDateValue(date) {
    const s = super._serializeDateValue(date);
    return s.length <= 12 ?
        'to_date(' + s + ', \'yyyy-mm-dd\')' :
        'to_date(' + s + ', \'yyyy-mm-dd hh24:mi:ss\')';
  }
}

Serializer.register('oracle', OracleSerializer);

module.exports = OracleSerializer;
