/* eslint-disable */

require('../');

const assert = require('assert'),
    sqb = require('sqb');

describe('Oracle dialect', function () {

    describe('Serialize "select" statements', function () {

        it('should serialize dual', function (done) {
            let statement = sqb.select().from();
            let result = statement.build('oracle');
            assert.equal(result.sql, 'select * from dual');
            done();
        });

        it('should replace "=" to "is" when value is null', function (done) {
            let statement = sqb.select().from().where(['ID', null]);
            let result = statement.build({
                dialect: 'oracle'
            });
            assert.equal(result.sql, 'select * from dual where ID is null');
            done();
        });

        it('should serialize date-time', function (done) {
            let statement = sqb.select().from('table1').where(['ID', new Date(2017, 0, 1, 10, 30, 15)]);
            let result = statement.build({
                dialect: 'oracle'
            });
            assert.equal(result.sql, "select * from table1 where ID = to_date('2017-01-01 10:30:15', 'yyyy-mm-dd hh24:mi:ss')");
            done();
        });

        it('should serialize date', function (done) {
            let statement = sqb.select().from('table1').where(['ID', new Date(2017, 0, 1, 0, 0, 0)]);
            let result = statement.build({
                dialect: 'oracle'
            });
            assert.equal(result.sql, "select * from table1 where ID = to_date('2017-01-01', 'yyyy-mm-dd')");
            done();
        });

        it('should serialize raw conditions', function (done) {
            let statement = sqb.select().from('table1').where([sqb.raw('ID=1')], ['ID2', sqb.raw('1')]);
            let result = statement.build({
                dialect: 'oracle'
            });
            assert.equal(result.sql, "select * from table1 where ID=1 and ID2 = 1");
            done();
        });

        it('should serialize "limit"', function (done) {
            let statement = sqb.select().from('table1').alias('t1').limit(10);
            let result = statement.build({
                dialect: 'oracle'
            });
            assert.equal(result.sql, "select t1.* from (select rownum row$number, t.* from (select * from table1) t) t1 where row$number <= 10");
            done();
        });

        it('should serialize "limit/offset"', function (done) {
            let statement = sqb.select().from('table1').offset(5).limit(10);
            let result = statement.build({
                dialect: 'oracle'
            });
            assert.equal(result.sql, "select * from (select rownum row$number, t.* from (select * from table1) t) where row$number >= 5 and row$number <= 15");
            done();
        });

        it('should serialize "offset"', function (done) {
            let statement = sqb.select().from('table1').offset(5);
            let result = statement.build({
                dialect: 'oracle'
            });
            assert.equal(result.sql, "select * from (select rownum row$number, t.* from (select * from table1) t) where row$number >= 5");
            done();
        });

        it('should serialize "limit/offset" pretty print ', function (done) {
            let statement = sqb.select().from('table1').offset(5).limit(10);
            let result = statement.build({
                dialect: 'oracle',
                prettyPrint: true
            });
            assert.equal(result.sql, "select * from (select rownum row$number, t.* from (\n  select * from table1\n) t)\nwhere row$number >= 5 and row$number <= 15");
            done();
        });

    });
});
