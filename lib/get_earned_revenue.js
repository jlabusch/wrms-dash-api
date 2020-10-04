var store = require('./data_store_query'),
    util = require('wrms-dash-util');

function periods(){
    let periods = [];

    for (let n = 0; n < 3; ++n){
        let d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - n);

        periods.push(d.getFullYear() + '-' + (d.getMonth()+1));
    }

    return periods;
}

function maybe_add_leading_zero(str){
    let parsed = util.dates.parse_period(str);
    if (parsed.month < 10){
        parsed.month = '0' + parsed.month;
    }
    return parsed.year + '-' + parsed.month;
}

module.exports = function(req, res, next, ctx){
    if (util.send_err_if_not_vendor(req, res, next, ctx, __filename)){
        return;
    }

    let handler = store.make_query_handler(req, res, next, ctx, __filename);

    store.query(
        util.trim  `SELECT  month_finished AS month,
                            worker AS person,
                            SUM(hours_earned) AS hours,
                            wr_id AS wr
                    FROM    earned_revenue
                    WHERE   month_finished in ('${periods().join("','")}')
                    GROUP BY month_finished,worker,wr_id`,
        handler(data => {
            if (!Array.isArray(data) || data.length < 1){
                util.log(__filename, 'ERROR: no revenue generated in ' + JSON.stringify(periods()));
                data = [];
            }

            let result = {months: {}, people: []},
                all_people = {};

            util.log_debug(__filename, JSON.stringify(data, null, 2));

            data.forEach(row => {
                let month_label = maybe_add_leading_zero(row.month);

                let m = result.months[month_label] || {},
                    p = m[row.person] || {hours: 0, wrs: {}};

                p.hours += row.hours;

                let w = p.wrs[row.wr] || 0;
                w += row.hours;

                p.wrs[row.wr] = w;
                m[row.person] = p;
                result.months[month_label] = m;

                all_people[row.person] = true;
            });

            result.people = Object.keys(all_people);

            return result;
        })
    );
}

