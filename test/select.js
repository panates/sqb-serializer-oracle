/* eslint-disable */

require('../');

const assert = require('assert'),
    sqb = require('sqb');

describe('Oracle dialect', function() {

  describe('Serialize "select" statements', function() {

    it('should serialize dual', function(done) {
      let statement = sqb.select().from();
      let result = statement.build('oracle');
      assert.equal(result.sql, 'select * from dual');
      done();
    });

    it('should replace "= null" to "is null"', function(done) {
      let statement = sqb.select().from().where(['ID', null]);
      let result = statement.build({
        dialect: 'oracle'
      });
      assert.equal(result.sql, 'select * from dual where ID is null');
      done();
    });

    it('should replace "!= null" to "is not null"', function(done) {
      let statement = sqb.select().from().where(['ID', '!=', null]);
      let result = statement.build({
        dialect: 'oracle'
      });
      assert.equal(result.sql, 'select * from dual where ID is not null');
      done();
    });

    it('should replace "<> null" to "is not null"', function(done) {
      let statement = sqb.select().from().where(['ID', '!=', null]);
      let result = statement.build({
        dialect: 'oracle'
      });
      assert.equal(result.sql, 'select * from dual where ID is not null');
      done();
    });

    it('should serialize date-time', function(done) {
      let statement = sqb.select()
          .from('table1')
          .where(['ID', new Date(2017, 0, 1, 10, 30, 15)]);
      let result = statement.build({
        dialect: 'oracle'
      });
      assert.equal(result.sql, 'select * from table1 where ID = to_date(\'2017-01-01 10:30:15\', \'yyyy-mm-dd hh24:mi:ss\')');
      done();
    });

    it('should serialize date', function(done) {
      let statement = sqb.select()
          .from('table1')
          .where(['ID', new Date(2017, 0, 1, 0, 0, 0)]);
      let result = statement.build({
        dialect: 'oracle'
      });
      assert.equal(result.sql, 'select * from table1 where ID = to_date(\'2017-01-01\', \'yyyy-mm-dd\')');
      done();
    });

    it('should serialize raw conditions', function(done) {
      let statement = sqb.select()
          .from('table1')
          .where(sqb.raw('ID=1'), sqb.raw('ID2 = 1'));
      let result = statement.build({
        dialect: 'oracle'
      });
      assert.equal(result.sql, 'select * from table1 where ID=1 and ID2 = 1');
      done();
    });

    it('should serialize "limit"', function(done) {
      let statement = sqb.select().from('table1').as('t1').limit(10);
      let result = statement.build({
        dialect: 'oracle'
      });
      assert.equal(result.sql, 'select t1.* from (select * from table1) where rownum <= 10');
      done();
    });

    it('should serialize "limit" pretty print', function(done) {
      let statement = sqb.select().from('table1').as('t1').limit(10);
      let result = statement.build({
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
      let statement = sqb.select()
          .from('table1')
          .offset(5)
          .limit(10);
      let result = statement.build({
        dialect: 'oracle'
      });
      assert.equal(result.sql, 'select * from (select /*+ first_rows(10) */ rownum row$number, t.* from (select * from table1) t where rownum <= 14) where row$number >= 5');
      done();
    });

    it('should serialize "limit/offset" pretty print', function(done) {
      let statement = sqb.select()
          .from('table1')
          .offset(5)
          .limit(10);
      let result = statement.build({
        dialect: 'oracle',
        prettyPrint: true
      });
      assert.equal(result.sql,
          'select * from (\n' +
          '  select /*+ first_rows(10) */ rownum row$number, t.* from (\n' +
          '    select * from table1\n' +
          '  ) t where rownum <= 14\n' +
          ') where row$number >= 5');
      done();
    });

    it('should serialize "limit" ordered', function(done) {
      let statement = sqb.select()
          .from('table1')
          .as('t1')
          .orderBy('id')
          .limit(10);
      let result = statement.build({
        dialect: 'oracle'
      });
      assert.equal(result.sql, 'select t1.* from (select /*+ first_rows(10) */ rownum row$number, t.* from (select * from table1 order by id) t where rownum <= 9) t1');
      done();
    });

    it('should serialize "limit" pretty print', function(done) {
      let statement = sqb.select()
          .from('table1')
          .as('t1')
          .orderBy('id')
          .limit(10);
      let result = statement.build({
        dialect: 'oracle',
        prettyPrint: true
      });
      assert.equal(result.sql,
          'select t1.* from (\n' +
          '  select /*+ first_rows(10) */ rownum row$number, t.* from (\n' +
          '    select * from table1\n' +
          '    order by id\n' +
          '  ) t where rownum <= 9\n' +
          ') t1');
      done();
    });

  });
});
