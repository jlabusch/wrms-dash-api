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
    "org_id": 99999,
    "org_name": "TEST ORG",
    "name": "TEST ORG",
    "type": "monthly",
    "hours": 80,
    "cash_value": 0,
    "cash_rate": 0,
    "cash_currency": "GBP",
    "start_date": "1 October 2008",
    "end_date": "31 October 2008",
    "systems": [ 99999 ]
};

var util = require('wrms-dash-util');

util.org_data.active().add_org(test_org);

function clone_pod(a){ return JSON.parse(JSON.stringify(a)) }

module.exports = {
    fake_response: fake_response,
    cp: clone_pod,
    get_test_org: function(){
        return clone_pod(test_org);
    },
    create_dummy_org: function(overrides){
        let o = clone_pod(test_org);
        Object.keys(overrides).forEach(k => {
            o[k] = overrides[k];
        });
        util.org_data.active().add_org(o);
        return o;
    },
    make_ctx: function(org){
        org = org || test_org;
        return {
            org: org.org_id,
            org_name: org.org_name,
            sys: clone_pod(org.systems),
            period: '2017-9'
        };
    }
}

