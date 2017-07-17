/* eslint-disable */

require('../');

const assert = require('assert'),
    sqb = require('sqb');

describe('Oracle select queries', function() {

  it('should use dual when no table given', function(done) {
    let query = sqb.select().from();
    let result = query.build('oracle');
    assert.equal(result.sql, 'select * from dual');
    done();
  });

  it('should replace "= null" to "is null"', function(done) {
    let query = sqb.select().from().where(['ID', null]);
    let result = query.build({
      dialect: 'oracle'
    });
    assert.equal(result.sql, 'select * from dual where ID is null');
    done();
  });

  it('should replace "!= null" to "is not null"', function(done) {
    let query = sqb.select().from().where(['ID', '!=', null]);
    let result = query.build({
      dialect: 'oracle'
    });
    assert.equal(result.sql, 'select * from dual where ID is not null');
    done();
  });

  it('should replace "<> null" to "is not null"', function(done) {
    let query = sqb.select().from().where(['ID', '!=', null]);
    let result = query.build({
      dialect: 'oracle'
    });
    assert.equal(result.sql, 'select * from dual where ID is not null');
    done();
  });

  it('should serialize date-time with "to_date()" function', function(done) {
    let query = sqb.select()
        .from('table1')
        .where(['dt', new Date(2017, 0, 1, 10, 30, 15)]);
    let result = query.build({
      dialect: 'oracle'
    });
    assert.equal(result.sql, 'select * from table1 where dt = to_date(\'2017-01-01 10:30:15\', \'yyyy-mm-dd hh24:mi:ss\')');
    done();
  });

  it('should serialize date with "to_date()" function', function(done) {
    let query = sqb.select()
        .from('table1')
        .where(['dt', new Date(2017, 0, 1, 0, 0, 0)]);
    let result = query.build({
      dialect: 'oracle'
    });
    assert.equal(result.sql, 'select * from table1 where dt = to_date(\'2017-01-01\', \'yyyy-mm-dd\')');
    done();
  });

  describe('Oracle server version <= 11', function() {

    it('should serialize "limit"', function(done) {
      let query = sqb.select().from('table1').as('t1').limit(10);
      let result = query.build({
        dialect: 'oracle'
      });
      assert.equal(result.sql, 'select t1.* from (select * from table1) where rownum <= 10');
      done();
    });

    it('should serialize "limit" pretty print', function(done) {
      let query = sqb.select().from('table1').as('t1').limit(10);
      let result = query.build({
        dialect: 'oracle',
        prettyPrint: true
      });
      assert.equal(result.sql,
          'select t1.* from (\n' +
          '  select * from table1\n' +
          ') where rownum <= 10');
      done();
    });

    it('should serialize "limit/offset"', function(done) {
      let query = sqb.select()
          .from('table1')
          .offset(5)
          .limit(10);
      let result = query.build({
        dialect: 'oracle'
      });
      assert.equal(result.sql, 'select * from (select /*+ first_rows(10) */ t.*, rownum row$number from (select * from table1) t where rownum <= 14) where row$number >= 5');
      done();
    });

    it('should serialize "limit/offset" pretty print', function(done) {
      let query = sqb.select()
          .from('table1')
          .offset(5)
          .limit(10);
      let result = query.build({
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
      let query = sqb.select()
          .from('table1')
          .as('t1')
          .orderBy('id')
          .limit(10);
      let result = query.build({
        dialect: 'oracle'
      });
      assert.equal(result.sql, 'select t1.* from (select /*+ first_rows(10) */ t.*, rownum row$number from (select * from table1 order by id) t where rownum <= 10) t1');
      done();
    });

    it('should serialize "limit" ordered pretty print', function(done) {
      let query = sqb.select()
          .from('table1')
          .as('t1')
          .orderBy('id')
          .offset(22)
          .limit(10);
      let result = query.build({
        dialect: 'oracle',
        prettyPrint: true
      });
      assert.equal(result.sql,
          'select t1.* from (\n' +
          '  select /*+ first_rows(10) */ t.*, rownum row$number from (\n' +
          '    select * from table1\n' +
          '    order by id\n' +
          '  ) t where rownum <= 31\n' +
          ') t1 where row$number >= 22');
      done();
    });

  });

  describe('Oracle server version >= 12', function() {

    it('should serialize "limit"', function(done) {
      let query = sqb.select().from('table1').as('t1').limit(10);
      let result = query.build({
        dialect: 'oracle',
        serverVersion: 12
      });
      assert.equal(result.sql, 'select * from table1 FETCH FIRST 10 ROWS ONLY');
      done();
    });

    it('should serialize "limit" pretty print', function(done) {
      let query = sqb.select().from('table1').as('t1').limit(10);
      let result = query.build({
        dialect: 'oracle',
        serverVersion: 12,
        prettyPrint: true
      });
      assert.equal(result.sql,
          'select * from table1\n' +
          'FETCH FIRST 10 ROWS ONLY');
      done();
    });

    it('should serialize "limit/offset"', function(done) {
      let query = sqb.select()
          .from('table1')
          .offset(5)
          .limit(10);
      let result = query.build({
        dialect: 'oracle',
        serverVersion: 12
      });
      assert.equal(result.sql, 'select * from table1 OFFSET 4 ROWS FETCH NEXT 10 ROWS ONLY');
      done();
    });

    it('should serialize "limit/offset" pretty print', function(done) {
      let query = sqb.select()
          .from('table1')
          .offset(5)
          .limit(10);
      let result = query.build({
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

