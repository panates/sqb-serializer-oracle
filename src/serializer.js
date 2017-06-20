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
    const limit = this.statement._limit || 0;
    const offset = Math.max((obj._offset || 0) - 1, 0);

    if (limit || offset) {
      if (this.config.serverVersion >= 12) {
        if (offset)
          out += (offset ? '\nOFFSET ' + offset + ' ROWS' : '') +
              (limit ? ' FETCH NEXT ' + limit + ' ROWS ONLY' : '');
        else out += (limit ? '\nFETCH FIRST ' + limit + ' ROWS ONLY' : '');
      } else {
        const a = obj._alias;
        const order = this.statement._orderby;
        if (offset || (order && order.length)) {
          out = 'select ' + (a ? a + '.' : '') + '* from (\n\t' +
              'select /*+ first_rows(' + (limit || 100) +
              ') */ rownum row$number, t.* from (\n\t' +
              out + '\n\b' +
              ') t' +
              (limit ? ' where rownum <= ' + (limit + offset) : '') +
              '\n\b)' + (a ? ' ' + a : '');
          if (offset)
            out += ' where row$number >= ' + (offset + 1);
        } else {
          out = 'select ' + (a ? a + '.' : '') + '* from (\n\t' +
              out + '\n\b' +
              ') where rownum <= ' + limit;
        }
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
