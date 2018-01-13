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

/**
 * Expose `OracleSerializer`.
 */
module.exports = OracleSerializer;

/**
 *
 * @constructor
 */
function OracleSerializer() {
  this.paramType = 0;
}

const proto = OracleSerializer.prototype;

proto.isReserved = function(ctx, s) {
  return reservedWords.indexOf(String(s).toLowerCase()) >= 0;
};

proto.serialize = function(ctx, type, o, defFn) {
  switch (type) {
    case 'select_query':
      return this.serializeSelect(ctx, o, defFn);
    case 'select_from':
      return this.serializeFrom(ctx, o, defFn);
    case 'operator_ne':
    case 'operator_eq':
      return this.serializeOperator(ctx, o, defFn);
    case 'date':
      return this.serializeDateValue(ctx, o, defFn);
    case 'returning':
      return this.serializeReturning(ctx, o, defFn);
  }
};

/**
 * @override
 */
proto.serializeSelect = function(ctx, o, defFn) {
  var out = defFn(ctx, o);
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
};

/**
 * @override
 */
proto.serializeFrom = function(ctx, o, defFn) {
  return defFn(ctx, o) || 'from dual';
};

/**
 * @override
 */
proto.serializeOperator = function(ctx, o, defFn) {
  var s = defFn(ctx, o);
  s = s
      .replace(/not = *null/g, 'is not null')
      .replace(/!= *null/g, 'is not null')
      .replace(/= *null/g, 'is null')
      .replace(/<> *null/g, 'is not null');
  return s;
};

/**
 * @override
 */
proto.serializeDateValue = function(ctx, o, defFn) {
  const s = defFn(ctx, o);
  return s.length <= 12 ?
      'to_date(' + s + ', \'yyyy-mm-dd\')' :
      'to_date(' + s + ', \'yyyy-mm-dd hh24:mi:ss\')';
};

/**
 * @override
 */
proto.serializeReturning = function(ctx, arr, defFn) {
  var out = '';
  arr.forEach(function(o, i) {
    out += (i ? ', ' : '') +
        (o.schema ? o.schema + '.' : '') +
        (o.table ? o.table + '.' : '') +
        (o.isReservedWord ? '"' + o.field + '"' : o.field) +
        ' into :returning$' + (o.alias || o.field);
  });
  return out;
};
