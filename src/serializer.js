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
    this.reservedWords = this.reservedWords.concat(['comment', 'dual']);
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   * @override
   */
  _serializeSelect(obj, inf) {
    let sql = super._serializeSelect(obj, inf);
    const prettyPrint = this.prettyPrint;
    const limit = this.statement._limit;
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
  _serializeTablesNames(tables, inf) {
    return super._serializeTablesNames(tables, inf) || 'dual';
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   * @override
   */
  _serializeCondition(item, inf) {
    let s = super._serializeCondition(item, inf);
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
  _serializeDateValue(date, inf) {
    const s = super._serializeDateValue(date, inf);
    return s.length <= 12 ?
        'to_date(' + s + ', \'yyyy-mm-dd\')' :
        'to_date(' + s + ', \'yyyy-mm-dd hh24:mi:ss\')';
  }
}

Serializer.register('oracle', OracleSerializer);

module.exports = OracleSerializer;
