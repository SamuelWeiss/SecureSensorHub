const crypto = require('crypto');

function do_single_hash(pass, salt) {
	return new Promise(resolve => {
		const hash = crypto.createHash('sha256');
		hash.on('readable', () => {
		  	const data = hash.read();
			if (data) {
				resolve(data.toString('hex'));
			}
		});
		hash.write(salt + pass);
		hash.end();
	});
}

function do_repeated_hash(word, salt, count) {
	return new Promise(resolve => {
		if (count > 0) {
			do_repeated_hash(word, salt, count-1).then(function(result) {
				do_single_hash(result, salt).then(function(result) {
					resolve(result);
				})
			});
			// do something I guess
		} else {
			// do_single_hash(pass, salt).then(function(result) {
			// 	console.log(result);
			// 	resolve(result);
			// })
			const hash = crypto.createHash('sha256');
			hash.on('readable', () => {
			  	const data = hash.read();
				if (data) {
					resolve(data.toString('hex'));
				}
			});
			hash.write(salt + word);
			hash.end();
		}
	});
}

do_repeated_hash('a','a', 1).then(function(result) {
	console.log("one hash: " + result);
});
do_repeated_hash('a','a', 2).then(function(result) {
	console.log("two hashes: " +  result);
});
do_repeated_hash('a','a', 3).then(function(result) {
	console.log("three hashes: " +  result);
});
do_repeated_hash('a','a', 1).then(function(result) {
	console.log("one hash: " + result);
});
console.log("start long hash");
do_repeated_hash('a','a', 1000).then(function(result) {
	console.log("1000 hashes: " +  result);
});

exports.no_user_records = function(arangoDB) {
	arangoDB.useDatabase('user_db');
	return new Promise(resolve => {
		arangoDB.query('FOR u IN userCollection RETURN u.uname').then(
	  		cursor => cursor.all()
		).then(
			keys => {
				if (keys.length == 0) {
					resolve(true);
				} else {
					resolve(false)
				}
			},
	  		err => {console.error('Failed to execute query:', err); resove(false)}
		);
		// reject(Error("Error checking user credentials"))
	});
}

exports.setup_user_database = function(arangoDB) {
  arangoDB.createDatabase('user_db').then(
	  ()  => console.log('User database created'),
	  err => {
	  	if (err.errorNum == 1207) {
	  		console.log('User database already created')
	  	} else {
	 		console.error('Failed to create database:', err.errorNum)
		}
	});
	arangoDB.useDatabase('user_db');
	return arangoDB;
}

exports.setup_data_database = function(arangoDB) {
  arangoDB.createDatabase('data_db').then(
	  ()  => console.log('data database created'),
	  err => {
	  	if (err.errorNum == 1207) {
	  		console.log('data database already created')
	  	} else {
	 		console.error('Failed to create database:', err.errorNum)
		}
	});
	arangoDB.useDatabase('data_db');
	return arangoDB;
}


exports.setup_user_collection = function(arangoDB) {
	var collection = arangoDB.collection('userCollection');
	collection.create().then(
	  () => console.log('User collection created'),
	  err => {
	  	if (err.errorNum == 1207) {
	  		console.log('User collection already created');
	  	} else {
	 		console.error('Failed to create user collection:', err.errorNum);
		}
	});
	return collection;
}

exports.setup_data_collection = function(arangoDB) {
	var collection = arangoDB.collection('dataCollection');
	collection.create().then(
	  () => console.log('data collection created'),
	  err => {
	  	if (err.errorNum == 1207) {
	  		console.log('data collection already created');
	  	} else {
	 		console.error('Failed to create data collection:', err.errorNum);
		}
	});
	return collection;
}

exports.check_user_credentials = function credential_check_promise(arangoDB, username, password) {
	arangoDB.useDatabase('user_db');
	return new Promise(resolve => {
		arangoDB.query('FOR u IN userCollection FILTER u.uname == @name SORT u.uname ASC RETURN u.salt', {'name':username}).then(
	  		cursor => cursor.all()
		).then(
	  		keys => {
	  			if (keys.length == 0) {
	  				resolve(false)
	  			} else if (keys.length != 1) {
	  				console.log("improper number of users with username " + username + " " + keys);
	  			}
  				do_single_hash(password, keys[0]).then(function(result) {
	  				arangoDB.query('FOR u IN userCollection FILTER u.uname == @name u.pass = @pass SORT u.uname ASC RETURN u.uname', {'name':username, 'pass':result}).then(
	  					cursor => cursor.all()
					).then(
						() => resolve(false),
	  					keys => {resolve(true)},
	  					err => {console.error('Failed to execute query:', err); resove(false)}
					);
				});
			},
	  		err => {console.error('Failed to execute query:', err); resove(false)}
		);
		// reject(Error("Error checking user credentials"))
	});
}

exports.add_user_credentials = function add_user_credentials_promise(arangoDB, auth_username, auth_password, new_username, new_password, new_salt /*, new_priv*/) {
	arangoDB.useDatabase('user_db');
	var collection = arangoDB.collection('userCollection');
	return new Promise(resolve => {
		credential_check_promise(arangoDB, auth_username, auth_username).then(function(result) {
			if (result) {
				arangoDB.query('FOR u IN userCollection FILTER u.uname == @name SORT u.uname ASC RETURN u.uname', {'name':new_username}).then(
	  				cursor => cursor.all()
				).then(
	  				keys => {
	  					if (keys.length == 0){
		  					do_single_hash(new_salt, new_password).then(function(result) {
		  						collection.save({
			  						uname: new_username,
				  					salt: new_salt,
				  					pass: result,
				  					c: Date(),
				  					priv: 'admin'
								}).then(
				  					meta => {console.log("added new user"); resolve(true)},
				  					err => {console.error('Failed to save document:', err); resolve(false)}
								);
							});
						} else {
							resolve('name in use')
						}
	  				},
					err => {console.error('Failed to execute query:', err); resove(false)}
				)
			}
		});
	});
}

exports.add_initial_user_credentials = function add_initial_user_credentials_promise(arangoDB, new_username, new_password, new_salt /*, new_priv*/) {
	arangoDB.useDatabase('user_db');
	var collection = arangoDB.collection('userCollection');
	return new Promise(resolve => {
		arangoDB.query('FOR u IN userCollection RETURN u.uname').then(
	  		cursor => cursor.all()
		).then(
			keys => {
				if (keys.length == 0) {
					do_single_hash(new_salt, new_password).then(function(result) {
						collection.save({
							uname: new_username,
		  					salt: new_salt,
		  					pass: result,
		  					c: new Date(),
		  					priv: 'admin'
						}).then(
		  					meta => {console.log("added new user"); resolve(true)},
		  					err => {console.error('Failed to save document:', err); resolve(false)}
						)
					});
				} else {
					console.log('Attempt to add initial user to existsing DB'); resolve(false)
				}
			},
	  		err => {console.error('Failed to execute query:', err); resove(false)}
		);
		// reject(Error("Error checking user credentials"))
	});
}

exports.get_data = function get_data_promise(arangoDB, username, password) {
	return new Promise(resolve => {
		arangoDB.useDatabase('data_db');
		arangoDB.query('FOR d IN dataCollection RETURN d').then(
			cursor => cursor.all()
		).then(
			data => resolve(data),
			err => {console.error('Failed to execute query:', err); resove(false)}
		);
	});
}

exports.list_db = function(arangoDB){
	console.log("in list_db");
	arangoDB.useDatabase('user_db');
	arangoDB.query('FOR u IN userCollection RETURN u.uname').then(
		cursor => cursor.all()
	).then(
		data => console.log('db: ' + data),
		err => console.error('Failed to execute query:', err)
	);
}

/*

exports.get_data = function get_data_promise(arangoDB, username, password) {
	arangoDB.useDatabase('user_db');
	return new Promise(resolve => {
	arangoDB.query('FOR u IN userCollection FILTER u.uname == @name, u.pass == @pass SORT u.uname ASC RETURN u.uname', {'name':username, 'pass':password}).then(
  		cursor => cursor.all()
	).then(
		() => resolve(false),
  		keys => {
  			arangoDB.useDatabase('data_db');
  			arangoDB.query('FOR d IN dataCollection RETURN d').then(
  				cursor => cursor.all()
  			).then(
  				() => resolve('no data'),
  				data => resolve(data),
  				err => {console.error('Failed to execute query:', err); resove(false)}
  			)
  		},
  		err => {console.error('Failed to execute query:', err); resove(false)}
	);
		// reject(Error("Error checking user credentials"))
	});
}


  	db.useDatabase('user_db');
  	db.query(qb.for('u').in('userCollection')
  		.filter(qb.eq('u.uname', user))
  		.filter(qb.eq('u.pass', pass))
  		.return('u.user')
  		).then(  cursor => cursor.all()
	).then(
  		keys => console.log('All keys:', keys.join(', ')),
  		err => console.error('Failed to execute query:', err)
	);
*/