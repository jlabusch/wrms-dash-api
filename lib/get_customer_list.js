var store = require('./data_store_query'),
    util = require('wrms-dash-util');

module.exports = function(req, res, next, ctx, __test_hook){
    let handler = store.make_query_handler(req, res, next, ctx, __filename);

    let sql = util.trim`SELECT  c.id,
                                c.org_name,
                                c.org_id,
                                s.system_id
                        FROM    contracts c
                        JOIN    contract_system_link s ON c.id=s.contract_id
                        ${ctx.org_name === '__vendor' ? "" : "WHERE c.org_id=" + ctx.org}
                        ORDER BY c.org_name,c.id`;

    store.query(
        sql,
        handler(data => {
            if (!Array.isArray(data)){
                data = [];
            }

            let r = {};

            __test_hook && __test_hook(sql);

            data.forEach(row => {
                let o = r[row.id] || {org_id: row.org_id, systems: []};
                o.systems.push(row.system_id);
                r[row.id] = o;
            })

            return r;
        })
    );
}

