var config  = require('config'),
    util    = require('wrms-dash-util');

function make_handler(req, res, next, ctx, label = __filename){
    return function(transform){
        return handler(req, res, next, ctx, transform, label);
    }
}

function handler_send_data(res, next, data){
    res.charSet('utf-8');
    res.json(data);
    next && next(false);
}

function handler_send_error(res, next, err, label){
    let e = err.message || err;
    util.log(label, 'ERROR: ' + e);
    handler_send_data(res, next, {error: e}, label);
}

function handler(req, res, next, ctx, transform, label = __filename){
    return function(err, data){
        if (err){
            handler_send_error(res, next, err, label);
            return;
        }

        if (transform){
            try{
                data = transform(data);
            }catch(ex){
                handler_send_error(res, next, ex, label);
                return;
            }
        }

        handler_send_data(res, next, data, label);
    }
}

var test_responses = [];

function load_test_response(err, rows){
    test_responses.push([err, rows]);
    return test_responses.length;
}

// Query remote store
function query(/* stmt, arg, ..., next(err,rows) */){
    let args = Array.prototype.slice.call(arguments, 0),
        next = function(){};

    if (typeof(args[args.length - 1]) === 'function'){
        next = args.pop();
    }

    util.log_debug(__filename, args[0]);

    // If preconfigured responses have been loaded by unit tests,
    // return their data rather than making an actual API call
    if (test_responses.length > 0){
        let r = test_responses.shift();
        process.nextTick(function(){
            next.apply(null, r);
        });
        return;
    }

    util.send_post({ url: config.get('api-cache.host') + '/query' }) // eslint-disable-line promise/catch-or-return
        .with({ query: args })
        .then(next);
}

module.exports = {
    query: query,
    load_test_response: load_test_response,
    query_send_error: handler_send_error,
    query_send_data: handler_send_data,
    make_query_handler: make_handler,
    query_handler: handler
}

