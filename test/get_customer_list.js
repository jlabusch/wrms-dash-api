var assert = require('assert'),
    testlib= require('wrms-dash-test-lib'),
    should = require('should'),
    get_customer_list = require('../lib/get_customer_list'),
    util = require('wrms-dash-util'),
    store = require('../lib/data_store_query');

let orgs = {
    acme: testlib.get_test_org({org_id: 1}),
    basco: testlib.get_test_org({org_id: 2})
}

var query_response = [
    {
        "id": orgs.acme.name,
        "org_name": orgs.acme.org_name,
        "org_id": orgs.acme.org_id,
        "system_id": orgs.acme.systems[0]
    },
    {
        "id": orgs.basco.name,
        "org_name": orgs.basco.org_name,
        "org_id": orgs.basco.org_id,
        "system_id": orgs.basco.systems[0]
    },
    {
        "id": orgs.basco.name,
        "org_name": orgs.basco.org_name,
        "org_id": orgs.basco.org_id,
        "system_id": orgs.basco.systems[1]
    }
];

var model_list = {};

model_list[orgs.acme.name] = {
    org_id: orgs.acme.org_id,
    systems: orgs.acme.systems
};

model_list[orgs.basco.name] = {
    org_id: orgs.basco.org_id,
    systems: orgs.basco.systems
};

describe('get_customer_list', function(){
    describe('query', function(){
        it('should return all clients when user is __vendor', function(done){
            let res = new testlib.fake_response(),
                ctx = testlib.make_ctx(),
                sql = '';

            function next(){
                (res.data_sent === 1).should.equal(true);
                (!res.data.error).should.equal(true);
                Array.isArray(sql.match(/WHERE c.org_id=/)).should.equal(false);
                (Object.keys(res.data).length).should.equal(2);
                should.exist(res.data[orgs.acme.name]);
                (res.data[orgs.basco.name].systems[1] === 3).should.equal(true);
                done();
            }

            store.load_test_response(null, testlib.cp(query_response));

            get_customer_list({}, res, next, ctx, s => {sql = s});
        });
        it('should limit results for client users', function(done){
            let res = new testlib.fake_response(),
                ctx = testlib.make_ctx(orgs.acme),
                sql = '';

            function next(){
                (res.data_sent === 1).should.equal(true);
                (!res.data.error).should.equal(true);
                Array.isArray(sql.match(/WHERE c.org_id=/)).should.equal(true);
                (Object.keys(res.data).length).should.equal(1);
                should.exist(res.data[orgs.acme.name]);
                done();
            }

            store.load_test_response(null, testlib.cp(query_response.filter(o => { return o.id === orgs.acme.name})));

            get_customer_list({}, res, next, ctx, s => {sql = s});
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

            get_customer_list({}, res, next, ctx);
        });
    });
});

