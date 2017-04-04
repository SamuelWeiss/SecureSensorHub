#!/usr/bin/env node

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
// var arangojs = require('arangojs');
var db = require('arangojs')();
var aql = require('arangojs').aql;
var qb = require('aqb');
const dbUtil = require('./dbUtil');
const crypto = require('crypto');


// var host = process.env.ARANGODB_HOST;
// var port = process.env.ARANGODB_PORT;
// var database = process.env.ARANGODB_DB;
// var username = process.env.ARANGODB_USERNAME;
// var password = process.env.ARANGODB_PASSWORD;
// var db = arangojs({
//   url: `http://${username}:${password}@${host}:${port}`,
//   databaseName: database // don't automatically append database path to URL 
// });

// create the user database
var user_db = dbUtil.setup_user_database(db);

// setup the collection to store data
var collection = dbUtil.setup_user_collection(user_db);

collection.truncate().then(
  () => console.log('Truncated collection'),
  err => console.error('Failed to truncate:', err)
);

var confirmed_users = false;


/*
User Record prototype
user = {
  uname: 'name',
  salt: 'random',
  pass: 'pass', (hashed)
  c: Date(),
  priv: 'admin' | 'user'
};
*/

/*
TODO: figure out how to integrate here
db.createDatabase('data_db').then(
  () => console.log('Database created'),
  err => console.error('Failed to create database:', err)
);
*/


// app.get('/hub', function(req, res){
//     res.sendFile(__dirname + '/hub.html');
// });

app.get('/', function(req, res){
	if (confirmed_users) {
	    res.sendFile(__dirname + '/hub.html');
	} else {
		dbUtil.no_user_records(user_db).then(function(result) {
			confirmed_users = !result;
			if (confirmed_users) {
			    res.sendFile(__dirname + '/hub.html');
			} else {
			    res.sendFile(__dirname + '/setup.html');		
			}
		})
	}
});

app.get('/chat', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

// socket code
io.on('connection', function(socket){
  socket.broadcast.emit('Hello snapcrafter');

  // chat functionality (maybe remove, it's fun)
  socket.on('chat message', function(user, msg){
    io.emit('chat message', user, msg);
  });

  // login functionality
  socket.on('login', function(user, pass){
  	// look it up in the database
  	dbUtil.check_user_credentials(user_db, user, pass).then(function(result) {
  		if (result) {
  			io.emit('login_success', user);
  		} else {
  			io.emit('login_failure', user);
  		}
  	});
  });
  socket.on('add user without credentials', function(user, pass) {
  	console.log('adding new user');
  	dbUtil.add_initial_user_credentials(user_db, user, pass, crypto.randomBytes(256).toString('hex')).then(function(result) {
  		if (result) {
  			io.emit('credential add success', user);
  			confirmed_users = true;
  		} else {
  			io.emit('credential add failure', user);
  		}
  	});
  });
  socket.on('add user with credentials', function(auth_user, auth_pass, new_user, new_pass) {
  	dbUtil.add_user_credentials(user_db, auth_user, auth_pass, new_user, new_pass, crypto.randomBytes(256).toString('hex')).then(function(result) {
  		if (result) {
  			io.emit('credential add success', user);
  			confirmed_users = true;
  		} else {
  			io.emit('credential add failure', user);
  		}
  	});
  });
  socket.on('get data', function(user, pass) {
  	dbUtil.get_data(user_db, user, pass).then(function(result) {
  		if (result == 'no data') {
  			io.emit('no data');
  		} else if (!result) {
  			io.emit('general failure');
  		} else {
  			io.emit('data', result)
  		}
  	});
  });
});



http.listen(3000, function(){
  console.log('listening on *:3000');
});
