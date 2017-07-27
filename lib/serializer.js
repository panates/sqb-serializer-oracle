/* sqb-serializer-oracle
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb-serializer-oracle/
 */

const reservedWords = ['comment', 'dual'];

class OracleSerializer {

  constructor() {
  }

  // noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
  isReserved(s) {
    return reservedWords.includes(String(s).toLowerCase());
  }

  //noinspection JSUnusedGlobalSymbols,JSMethodCanBeStatic
  /**
   * @override
   */
  serializeSelect(instance, obj, inf) {
    let out = instance.serializeSelect(obj, inf);
    const limit = instance.query._limit || 0;
    const offset = Math.max((obj._offset || 0), 0);

    if (limit || offset) {
      if (instance.config.serverVersion >= 12) {
        if (offset)
          out += (offset ? '\nOFFSET ' + offset + ' ROWS' : '') +
              (limit ? ' FETCH NEXT ' + limit + ' ROWS ONLY' : '');
        else out += (limit ? '\nFETCH FIRST ' + limit + ' ROWS ONLY' : '');
      } else {
        const a = obj._alias;
        const order = instance.query._orderby;
        if (offset || (order && order.length)) {
          out = 'select ' + (a ? a + '.' : '') + '* from (\n\t' +
              'select /*+ first_rows(' + (limit || 100) +
              ') */ t.*, rownum row$number from (\n\t' +
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

  //noinspection JSUnusedGlobalSymbols,JSMethodCanBeStatic
  /**
   * @override
   */
  serializeFrom(instance, tables, inf) {
    return instance.serializeFrom(tables, inf) || 'from dual';
  }

  //noinspection JSUnusedGlobalSymbols,JSMethodCanBeStatic
  /**
   * @override
   */
  serializeCondition(instance, item, inf) {
    let s = instance.serializeCondition(item, inf);
    if (!item.isRaw) {
      s = s.replace(/!= ?null/g, 'is not null')
          .replace(/= ?null/g, 'is null')
          .replace(/<> ?null/g, 'is not null');
    }
    return s;
  }

  //noinspection JSUnusedGlobalSymbols,JSMethodCanBeStatic
  /**
   * @override
   */
  serializeDateValue(instance, date, inf) {
    const s = instance.serializeDateValue(date, inf);
    return s.length <= 12 ?
        'to_date(' + s + ', \'yyyy-mm-dd\')' :
        'to_date(' + s + ', \'yyyy-mm-dd hh24:mi:ss\')';
  }

}

module.exports = OracleSerializer;
