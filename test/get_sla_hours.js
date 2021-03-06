var assert = require('assert'),
    testlib= require('wrms-dash-test-lib'),
    should = require('should'),
    get_sla_hours = require('../lib/get_sla_hours'),
    util = require('wrms-dash-util'),
    store = require('../lib/data_store_query');

let orgs = {
    acme: testlib.get_test_org({org_id: 1}),
    basco: testlib.get_test_org({org_id: 2})
}

var query_response = [
    {
        "id": orgs.basco.name + " annual 2017-1 to 2018-1",
        "base_hours": 20,
        "base_hours_spent": 15,
        "sla_quote_hours": 11,
        "additional_hours": 47.75
    },
    {
        "id": orgs.acme.name + " month 2017-8",
        "base_hours": orgs.acme.hours,
        "base_hours_spent": 80.5,
        "sla_quote_hours": 66,
        "additional_hours": 0
    },
    {
        "id": orgs.acme.name + " month 2017-9",
        "base_hours": orgs.acme.hours,
        "base_hours_spent": 80.5,
        "sla_quote_hours": 72.5,
        "additional_hours": 0
    },
    {
        "id": orgs.acme.name + " month 2017-10",
        "base_hours": orgs.acme.hours,
        "base_hours_spent": 7,
        "sla_quote_hours": 0,
        "additional_hours": 0
    },
    {
        "id": orgs.acme.name + " month 2017-11",
        "base_hours": orgs.acme.hours,
        "base_hours_spent": 14,
        "sla_quote_hours": 0,
        "additional_hours": 0
    }
];

describe('get_sla_hours', function(){
    describe('query', function(){
        it('should handle monthly budgets', function(done){
            let res = new testlib.fake_response(),
                ctx = testlib.make_ctx(orgs.acme);

            function next(){
                (res.data_sent === 1).should.equal(true);
                (!res.data.error).should.equal(true);
                res.data.budget.should.equal(80);
                Array.isArray(res.data.result).should.equal(true);
                res.data.result[0][1].should.equal(72.5);
                res.data.result[1][1].should.equal(8);
                res.data.result[2][1].should.equal(0);
                done();
            }

            store.load_test_response(null, testlib.cp(query_response.filter(x => {
                return x.id.startsWith(orgs.acme.name);
            })));

            get_sla_hours({}, res, next, ctx);
        });
        it('should handle biannual budgets', function(done){
            let res = new testlib.fake_response(),
                ctx = testlib.make_ctx(orgs.basco);

            function next(){
                (res.data_sent === 1).should.equal(true);
                (!res.data.error).should.equal(true);
                res.data.budget.should.equal(20);
                Array.isArray(res.data.result).should.equal(true);
                res.data.result[0][1].should.equal(11);
                res.data.result[1][1].should.equal(4);
                res.data.result[2][1].should.equal(47.75);
                done();
            }

            store.load_test_response(null, testlib.cp(query_response.filter(x => {
                return x.id.startsWith(orgs.basco.name);
            })));

            get_sla_hours({}, res, next, ctx);
        });
        it('should handle errors', function(done){
            let res = new testlib.fake_response(),
                ctx = testlib.make_ctx();

            function next(){
                (res.data_sent === 1).should.equal(true);
                should.exist(res.data.error);
                done();
            }

            store.load_test_response(new Error("test error"));

            get_sla_hours({}, res, next, ctx);
        });
    });
});

