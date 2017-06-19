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
    let out = super._serializeSelect(obj, inf);
    const limit = this.statement._limit;
    const offset = obj._offset;
    const a = obj._alias;

    if (limit || offset) {
      const order = this.statement._orderby;
      if (offset || (order && order.length)) {
        out = 'select ' + (a ? a + '.' : '') +
            '* from (select rownum row$number, t.* from (\n\t' +
            out + '\n\b' +
            ') t)' + (a ? ' ' + a : '') +
            '\nwhere';

        if (offset)
          out += ' row$number >= ' + offset + 1;
        if (limit)
          out += (offset ? ' and' : '') + ' row$number <= ' +
              (limit + (offset || 0));
      } else {
        out = 'select ' + (a ? a + '.' : '') + '* from (\n\t' +
            out + '\n\b' +
            ') where';
        if (offset)
          out += ' rownum >= ' + offset + 1;
        if (limit)
          out += (offset ? ' and' : '') + ' rownum <= ' +
              (limit + (offset || 0));
      }
    }
    return out;
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   * @override
   */
  _serializeFrom(tables, inf) {
    return super._serializeFrom(tables, inf) || 'from dual';
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
