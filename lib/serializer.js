/* sqb-serializer-oracle
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb-serializer-oracle/
 */
/**
 * Module variables.
 * @private
 */
const reservedWords = ['comment', 'dual'];

class OracleSerializer {

  /**
   *
   * @constructor
   */
  constructor() {
    this.paramType = 0;
  }

  isReserved(ctx, s) {
    return reservedWords.indexOf(String(s).toLowerCase()) >= 0;
  }

  serialize(ctx, type, o, defFn) {
    switch (type) {
      case 'select_query':
        return this.serializeSelect(ctx, o, defFn);
      case 'select_from':
        return this.serializeFrom(ctx, o, defFn);
      case 'operator':
        return this.serializeOperator(ctx, o, defFn);
      case 'date':
        return this.serializeDateValue(ctx, o, defFn);
      case 'returning':
        return this.serializeReturning(ctx, o, defFn);
    }
  }

  serializeSelect(ctx, o, defFn) {
    let out = defFn(ctx, o);
    const limit = o.limit || 0;
    const offset = Math.max((o.offset || 0), 0);

    if (limit || offset) {
      if (ctx.serverVersion >= 12) {
        if (offset)
          out += '\nOFFSET ' + offset + ' ROWS' +
              (limit ? ' FETCH NEXT ' + limit + ' ROWS ONLY' : '');
        else out += '\nFETCH FIRST ' + limit + ' ROWS ONLY';
      } else {
        if (offset || o.orderBy) {
          out = 'select * from (\n\t' +
              'select /*+ first_rows(' + (limit || 100) +
              ') */ t.*, rownum row$number from (\n\t' +
              out + '\n\b' +
              ') t' +
              (limit ? ' where rownum <= ' + (limit + offset) : '') + '\n\b)';
          if (offset)
            out += ' where row$number >= ' + (offset + 1);
        } else {
          out = 'select * from (\n\t' +
              out + '\n\b' +
              ') where rownum <= ' + limit;
        }
      }
    }
    return out;
  }

  serializeFrom(ctx, o, defFn) {
    return defFn() || 'from dual';
  }

  serializeOperator(ctx, o, defFn) {
    if (o.operatorType === 'eq' && o.value1 === 'null')
      return o.expression + ' is ' + o.value1;
    if (o.operatorType === 'ne' && o.value1 === 'null')
      return o.expression + ' is not ' + o.value1;
    return defFn(o);
  }

  serializeDateValue(ctx, o, defFn) {
    const s = defFn(ctx, o);
    return s.length <= 12 ?
        'to_date(' + s + ', \'yyyy-mm-dd\')' :
        'to_date(' + s + ', \'yyyy-mm-dd hh24:mi:ss\')';
  }

  serializeReturning(ctx, arr, defFn) {
    let out = '';
    for (const [i, o] of arr.entries()) {
      out += (i ? ', ' : '') +
          (o.schema ? o.schema + '.' : '') +
          (o.table ? o.table + '.' : '') +
          (o.isReservedWord ? '"' + o.field + '"' : o.field) +
          ' into :returning$' + (o.alias || o.field);
    }
    return out;
  }
}

/**
 * Expose `OracleSerializer`.
 */
module.exports = OracleSerializer;
