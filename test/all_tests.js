/* eslint-disable */

const assert = require('assert'),
    sqb = require('sqb'),
    Op = sqb.Op;

sqb.use(require('../'));

var query;
var result;

describe('Oracle select queries', function() {

  it('should use dual when no table given', function(done) {
    query = sqb.select().from();
    result = query.generate({
      dialect: 'oracle',
      prettyPrint: 0
    });
    assert.equal(result.sql, 'select * from dual');
    done();
  });

  it('should replace "= null" to "is null"', function(done) {
    query = sqb.select().from().where(Op.eq('ID', null));
    result = query.generate({
      dialect: 'oracle',
      prettyPrint: 0
    });
    assert.equal(result.sql, 'select * from dual where ID is null');
    done();
  });

  it('should replace "!= null" to "is not null"', function(done) {
    query = sqb.select().from().where(Op.ne('ID', null));
    result = query.generate({
      dialect: 'oracle',
      prettyPrint: 0
    });
    assert.equal(result.sql, 'select * from dual where ID is not null');
    done();
  });

  it('should serialize date-time with "to_date()" function', function(done) {
    query = sqb.select()
        .from('table1')
        .where(Op.eq('dt', new Date(2017, 0, 1, 10, 30, 15)));
    result = query.generate({
      dialect: 'oracle',
      prettyPrint: 0
    });
    assert.equal(result.sql, 'select * from table1 where dt = to_date(\'2017-01-01 10:30:15\', \'yyyy-mm-dd hh24:mi:ss\')');
    done();
  });

  it('should serialize date with "to_date()" function', function(done) {
    query = sqb.select()
        .from('table1')
        .where(Op.eq('dt', new Date(2017, 0, 1, 0, 0, 0)));
    result = query.generate({
      dialect: 'oracle',
      prettyPrint: 0
    });
    assert.equal(result.sql, 'select * from table1 where dt = to_date(\'2017-01-01\', \'yyyy-mm-dd\')');
    done();
  });

  it('Should serialize params', function(done) {
    query = sqb.select().from('table1').where(Op.eq('ID', /ID/));
    result = query.generate({
      dialect: 'oracle',
      prettyPrint: 0
    }, {ID: 5});
    assert.equal(result.sql, 'select * from table1 where ID = :ID');
    assert.deepEqual(result.values, {ID: 5});
    done();
  });

  it('Should serialize returning', function(done) {
    query = sqb.insert('table1', {'id': 1})
        .returning({id: 'number', name: 'string'});
    result = query.generate({
      dialect: 'oracle',
      prettyPrint: 0
    });
    assert.equal(result.sql, 'insert into table1 (id) values (1) returning id into :returning$id, name into :returning$name');
    done();
  });

  it('Should serialize returning - table.field', function(done) {
    query = sqb.insert('table1', {'id': 1})
        .returning({'table1.id': 'number', 'table1.name': 'string'});
    result = query.generate({
      dialect: 'oracle',
      prettyPrint: 0
    });
    assert.equal(result.sql, 'insert into table1 (id) values (1) returning table1.id into :returning$id, table1.name into :returning$name');
    done();
  });

  it('Should serialize returning - schema.table.field', function(done) {
    query = sqb.insert('table1', {'id': 1})
        .returning({'table1.id': 'number', 'schema1.table1.name': 'string'});
    result = query.generate({
      dialect: 'oracle',
      prettyPrint: 0
    });
    assert.equal(result.sql, 'insert into table1 (id) values (1) returning table1.id into :returning$id, schema1.table1.name into :returning$name');
    done();
  });

  it('Should serialize returning - reserved word', function(done) {
    query = sqb.insert('table1', {'id': 1})
        .returning({id: 'number', 'with w1': 'string'});
    result = query.generate({
      dialect: 'oracle',
      prettyPrint: 0
    });
    assert.equal(result.sql, 'insert into table1 (id) values (1) returning id into :returning$id, "with" into :returning$w1');
    done();
  });

  describe('Oracle server version <= 11', function() {

    it('should serialize "limit"', function(done) {
      query = sqb.select().from('table1').limit(10);
      result = query.generate({
        dialect: 'oracle',
        prettyPrint: 0
      });
      assert.equal(result.sql, 'select * from (select * from table1) where rownum <= 10');
      done();
    });

    it('should serialize "limit" pretty print', function(done) {
      query = sqb.select().from('table1').limit(10);
      result = query.generate({
        dialect: 'oracle',
        prettyPrint: true
      });
      assert.equal(result.sql,
          'select * from (\n' +
          '  select * from table1\n' +
          ') where rownum <= 10');
      done();
    });

    it('should serialize "offset"', function(done) {
      query = sqb.select()
          .from('table1')
          .offset(4);
      result = query.generate({
        dialect: 'oracle',
        prettyPrint: 0
      });
      assert.equal(result.sql, 'select * from (select /*+ first_rows(100) */ t.*, rownum row$number from (select * from table1) t) where row$number >= 5');
      done();
    });

    it('should serialize "limit/offset"', function(done) {
      query = sqb.select()
          .from('table1')
          .offset(4)
          .limit(10);
      result = query.generate({
        dialect: 'oracle',
        prettyPrint: 0
      });
      assert.equal(result.sql, 'select * from (select /*+ first_rows(10) */ t.*, rownum row$number from (select * from table1) t where rownum <= 14) where row$number >= 5');
      done();
    });

    it('should serialize "limit/offset" pretty print', function(done) {
      query = sqb.select()
          .from('table1')
          .offset(4)
          .limit(10);
      result = query.generate({
        dialect: 'oracle',
        prettyPrint: true
      });
      assert.equal(result.sql,
          'select * from (\n' +
          '  select /*+ first_rows(10) */ t.*, rownum row$number from (\n' +
          '    select * from table1\n' +
          '  ) t where rownum <= 14\n' +
          ') where row$number >= 5');
      done();
    });

    it('should serialize "limit" ordered', function(done) {
      query = sqb.select()
          .from('table1')
          .orderBy('id')
          .limit(10);
      result = query.generate({
        dialect: 'oracle',
        prettyPrint: 0
      });
      assert.equal(result.sql, 'select * from (select /*+ first_rows(10) */ t.*, rownum row$number from (select * from table1 order by id) t where rownum <= 10)');
      done();
    });

    it('should serialize "limit" ordered pretty print', function(done) {
      query = sqb.select()
          .from('table1')
          .orderBy('id')
          .offset(21)
          .limit(10);
      result = query.generate({
        dialect: 'oracle',
        prettyPrint: true
      });
      assert.equal(result.sql,
          'select * from (\n' +
          '  select /*+ first_rows(10) */ t.*, rownum row$number from (\n' +
          '    select * from table1\n' +
          '    order by id\n' +
          '  ) t where rownum <= 31\n' +
          ') where row$number >= 22');
      done();
    });

  });

  describe('Oracle server version >= 12', function() {

    it('should serialize "limit"', function(done) {
      query = sqb.select().from('table1').limit(10);
      result = query.generate({
        dialect: 'oracle',
        serverVersion: 12,
        prettyPrint: 0
      });
      assert.equal(result.sql, 'select * from table1 FETCH FIRST 10 ROWS ONLY');
      done();
    });

    it('should serialize "limit" pretty print', function(done) {
      query = sqb.select().from('table1').limit(10);
      result = query.generate({
        dialect: 'oracle',
        serverVersion: 12,
        prettyPrint: true
      });
      assert.equal(result.sql,
          'select * from table1\n' +
          'FETCH FIRST 10 ROWS ONLY');
      done();
    });

    it('should serialize "offset"', function(done) {
      query = sqb.select()
          .from('table1')
          .offset(4);
      result = query.generate({
        dialect: 'oracle',
        serverVersion: 12,
        prettyPrint: 0
      });
      assert.equal(result.sql, 'select * from table1 OFFSET 4 ROWS');
      done();
    });

    it('should serialize "limit/offset"', function(done) {
      query = sqb.select()
          .from('table1')
          .offset(4)
          .limit(10);
      result = query.generate({
        dialect: 'oracle',
        serverVersion: 12,
        prettyPrint: 0
      });
      assert.equal(result.sql, 'select * from table1 OFFSET 4 ROWS FETCH NEXT 10 ROWS ONLY');
      done();
    });

    it('should serialize "limit/offset" pretty print', function(done) {
      query = sqb.select()
          .from('table1')
          .offset(4)
          .limit(10);
      result = query.generate({
        dialect: 'oracle',
        serverVersion: 12,
        prettyPrint: true
      });
      assert.equal(result.sql,
          'select * from table1\n' +
          'OFFSET 4 ROWS FETCH NEXT 10 ROWS ONLY');
      done();
    });

  });

});

