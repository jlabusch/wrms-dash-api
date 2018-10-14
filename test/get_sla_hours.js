var assert = require('assert'),
    should = require('should');

function fake_response(handler){
    this.data_sent = 0;
    this.data = null;
}

fake_response.prototype.json = function(j){
    this.data_sent++;
    this.data = j;
}

fake_response.prototype.charSet = function(){}

var test_org = {
    "org_id": 123,
    "org_name": "Acme Co",
    "name": "Acme Co",
    "type": "monthly",
    "hours": 80,
    "cash_value": 0,
    "cash_rate": 0,
    "cash_currency": "GBP",
    "start_date": "1 October 2008",
    "end_date": "31 October 2008",
    "systems": [ 456 ]
};

function make_ctx(){
    return {
        org: test_org.org_id,
        org_name: test_org.org_name,
        sys: test_org.systems,
        period: '2017-9'
    };
}

var get_sla_hours = require('../lib/get_sla_hours'),
    util = require('wrms-dash-util'),
    store = require('../lib/data_store_query');

util.org_data.active().add_org(test_org);

var basic_response = [
    {
        "id": test_org.org_name + " month 2017-8",
        "base_hours": test_org.hours,
        "base_hours_spent": 80.5,
        "sla_quote_hours": 66,
        "additional_hours": 0
    },
    {
        "id": test_org.org_name + " month 2017-9",
        "base_hours": test_org.hours,
        "base_hours_spent": 80.5,
        "sla_quote_hours": 72.5,
        "additional_hours": 0
    },
    {
        "id": test_org.org_name + " month 2017-10",
        "base_hours": test_org.hours,
        "base_hours_spent": 7,
        "sla_quote_hours": 0,
        "additional_hours": 0
    },
    {
        "id": test_org.org_name + " month 2017-11",
        "base_hours": test_org.hours,
        "base_hours_spent": 14,
        "sla_quote_hours": 0,
        "additional_hours": 0
    }
];

describe('get_sla_hours', function(){
    describe('query', function(){
        it('should handle basic query', function(done){
            let res = new fake_response(),
                ctx = make_ctx();

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

            store.load_test_response(null, JSON.parse(JSON.stringify(basic_response)));

            get_sla_hours({}, res, next, ctx);
        });
    });
});

