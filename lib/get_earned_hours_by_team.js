var store = require('./data_store_query'),
    team  = require('./get_team_planner_data'),
    util  = require('wrms-dash-util');

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

function get_team_for_person(team_data, name){
    let result;

    if (team_data && team_data.teams){
        Object.keys(team_data.teams).forEach(key => {
            if (!result && team_data.teams[key].includes(name)){
                result = key;
            }
        });
    }

    return result || 'Other';
}

module.exports = function(req, res, next, ctx){
    if (util.send_err_if_not_vendor(req, res, next, ctx, __filename)){
        return;
    }

    team.fetcher().then(
        (team_data) => {
            let handler = store.make_query_handler(req, res, next, ctx, __filename);

            store.query(
                util.trim  `SELECT  er.month_finished AS month,
                                    c.org_name AS org,
                                    er.worker AS person,
                                    SUM(er.hours_earned) AS hours
                            FROM    earned_revenue er
                            LEFT JOIN wrs w ON er.wr_id=w.id
                            LEFT JOIN systems s ON w.system_id=s.id
                            LEFT JOIN contract_system_link csl ON csl.system_id=s.id
                            LEFT JOIN contracts c ON c.id=csl.contract_id
                            WHERE er.month_finished in ('${periods().join("','")}')
                            GROUP BY er.month_finished,c.org_name,er.worker`,
                handler(data => {
                    if (!Array.isArray(data) || data.length < 1){
                        util.log(__filename, 'ERROR: no value generated in ' + JSON.stringify(periods()));
                        data = [];
                    }

                    let result = {
                        // <month>: {
                        //     <team>: {
                        //         <org>: <hours>
                        //     }
                        // }
                    };

                    util.log_debug(__filename, JSON.stringify(data, null, 2));

                    data.forEach(row => {
                        util.log_debug(__filename, JSON.stringify(row));

                        let month = result[row.month] || {};
                        let team_name = get_team_for_person(team_data, row.person);
                        let team = month[team_name] || {};
                        let org = team[row.org] || 0;

                        org += row.hours;

                        team[row.org] = org;
                        month[team_name] = team;
                        result[row.month] = month;
                    });

                    return result;
                })
            );
        },
        (err) => {
            util.log_debug(__filename, 'Error getting team planner data');
            store.query_send_error(res, next, err, __filename);
        }
    );

}

