var util  = require('wrms-dash-util'),
    store = require('./data_store_query');

'use strict';

function parse_sheet(next){
    return function(err, res, body){
        if (err){
            next(err);
        }else if (!body || !body.values){
            next(new Error('Missing data in team planner'));
        }else if (body.error){
            next(new Error(body.error.status + ' ' + body.error.message));
        }else{
            next(null, body.values);
        }
    }
}

function query_sheet(range, next){
    if (!process.env['GOOGLE_API_KEY']){
        process.nextTick(() => {
            next(new Error("can't read team planner, GOOGLE_API_KEY not set"));
        });
        return;
    }
    const sheet = process.env['GOOGLE_SHEET_ID'] || '1JhPBMXINl7R-igc2VW3QxkyRVq0cXGf5cjb72iFTjxU';
    util.request(
        {url: 'https://sheets.googleapis.com/v4/spreadsheets/' + sheet + '/values/' + range + '?key=' + process.env['GOOGLE_API_KEY']},
        parse_sheet(next)
    );
}

function got_all_team_data(obj){
    return obj.mi6 && obj.n7 && obj.sre;
}

function get_team(obj, name, range, next){
    query_sheet(range, (err, val) => {
        if (err){
            next(err)
        }else{
            obj[name] = val.map(x => x[0]);
            if (got_all_team_data(obj)){
                next(null, obj);
            }
        }
    });
}

function get_teams(next){
    let state = {};

    get_team(state, 'mi6', 'Metadata!D2:D20', next);
    get_team(state, 'n7',  'Metadata!E2:E20', next);
    get_team(state, 'sre', 'Metadata!F2:F20', next);
}

function get_constants(next){
    query_sheet('Metadata!A1:B20', next);
}

var __test_planner = undefined;

function fetch_planner(){
    return new Promise((resolve, reject) => {
        if (__test_planner){
            process.nextTick(() => { resolve(__test_planner); });
            return;
        }
        get_constants((err, constants) => {
            if (err){
                reject(err);
            }else{
                get_teams((err, teams) => {
                    if (err){
                        reject(err);
                    }else{
                        resolve({
                            meta: constants,
                            teams: teams
                        });
                    }
                });
            }
        });
    });
}

module.exports = function(req, res, next, ctx){
    if (util.send_err_if_not_vendor(req, res, next, ctx, __filename)){
        return;
    }

    fetch_planner().then(
        (data) => {store.query_send_data(res, next, data)},
        (err) => {store.query_send_error(res, next, err, __filename)}
    );
}

