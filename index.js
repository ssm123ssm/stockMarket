// Setup basic express server
var express = require('express');
var mongo = require('mongodb').MongoClient;
var app = express();
var databases = require('./config/databases');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var yahooFinance = require('yahoo-finance');
var port = 80;
var mongourl = 'mongodb://ssm123ssm:chandrani123@ds125113.mlab.com:25113/stocks';

server.listen(process.env.PORT || port, function () {
    console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

var numUsers = 0;

io.on('connection', function (socket) {
    function sendAll() {
        console.log('Sendall fn...');


        mongo.connect(mongourl, function (err, db) {
            if (err) {
                console.log(err.message);
            } else {
                var col = db.collection('data');
                col.find({}).toArray(function (err, ress) {
                    if (err) {
                        console.log(err.message);
                    } else {
                        var ret = {};
                        //console.log(ress);
                        ret['info'] = ress;
                        socket.emit('allData', ret);
                        console.log('emitted');
                        db.close();
                    }
                });
            }

        });
    }
    console.log('Connected');
    sendAll();
    //send all stock info by emiting custom event

    socket.on('remove', function (data) {
        console.log('...remover...');

        var sym = data.sym;
        console.log('removing ' + data.sym);
        mongo.connect(mongourl, function (err, db) {
            if (err) {
                console.log(err.message);
            } else {
                var col = db.collection('data');

                col.remove({
                    name: sym
                });
                console.log('removed');

                db.close();
                console.log('...refresher...');
                //io.sockets.emit('testEmit', {});
                console.log('Sendall fn...');
                mongo.connect(mongourl, function (err, db) {
                    if (err) {
                        console.log(err.message);
                    } else {
                        var col = db.collection('data');
                        col.find({}).toArray(function (err, ress) {
                            if (err) {
                                console.log(err.message);
                            } else {
                                var ret = {};
                                ret['info'] = ress;
                                io.sockets.emit('allData', ret);
                                console.log('emitted');
                                //res.redirect('/');
                                db.close();
                            }
                        });
                    }

                });
            }

        });
    });
    app.get('/test', function (req, res) {

        var sym = req.query.sym;
        var now = new Date(Date.now());
        var ins = now.getFullYear() + '-' + now.getMonth() + '-' + now.getDate();
        console.log('Preparing to insert');
        yahooFinance.historical({
            symbol: sym,
            from: '2010-07-05',
            to: new Date(),
            // period: 'd'  // 'd' (daily), 'w' (weekly), 'm' (monthly), 'v' (dividends only) 
        }, function (err, quotes) {
            //... 
            //res.send(quotes);
            mongo.connect(mongourl, function (err, db) {
                if (err) {
                    console.log(err.message);
                } else {
                    var col = db.collection('data');
                    col.find({
                        name: sym

                    }).toArray(function (err, ress) {
                        if (err) {
                            console.log(err.message);
                        } else {
                            //console.log(ress[0]);
                            if (ress.length == 0) {
                                //res.send('NO INFO');

                                var insertion = {};
                                insertion['name'] = sym;
                                //insertion['data'] = quotes;
                                var ret = [];
                                if (quotes.length == 0) {
                                    console.log('NO ENTRY');

                                    //res.end();

                                    socket.emit('nodata', {});
                                    res.redirect('/');
                                    //res.redirect('/');
                                    //ins['nodata'] = true;
                                } else {
                                    for (var i = 0; i < quotes.length; i++) {
                                        var ins = {};
                                        ins['date'] = quotes[i].date;
                                        ins['val'] = quotes[i].open;
                                        ret.push(ins);
                                    }
                                    ret.reverse();
                                    insertion['data'] = ret;
                                    col.insert(insertion);
                                    db.close();
                                    //res.redirect('/refresh');
                                    ///////
                                    console.log('...refresher...');
                                    //io.sockets.emit('testEmit', {});
                                    console.log('Sendall fn...');
                                    mongo.connect(mongourl, function (err, db) {
                                        if (err) {
                                            console.log(err.message);
                                        } else {
                                            var col = db.collection('data');
                                            col.find({}).toArray(function (err, ress) {
                                                if (err) {
                                                    console.log(err.message);
                                                } else {
                                                    var ret = {};
                                                    ret['info'] = ress;
                                                    io.sockets.emit('allData', ret);
                                                    console.log('emitted');
                                                    res.redirect('/');
                                                    db.close();
                                                }
                                            });
                                        }

                                    });

                                }

                                /////////
                                // sendAll();
                                //socket.broadcast.emit('new', {});

                            } else {
                                console.log('EXISTS!');
                                res.redirect('/');
                            }
                        }
                    });
                }

            });

            console.log('Test Data Sent...');
        });
    });



    socket.on('disconnect', function (data) {
        console.log('Disconnected');
    });
});
