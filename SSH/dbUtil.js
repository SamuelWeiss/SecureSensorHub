const crypto = require('crypto');


function do_single_hash(pass, salt) {
	const hash = crypto.createHash('sha256');
	return new Promise(resolve => {
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

exports.no_user_records = function(arangoDB) {
	arangoDB.useDatabase('user_db');
	return new Promise(resolve => {
		arangoDB.query('FOR u IN userCollection RETURN u.uname').then(
	  		cursor => cursor.all()
		).then(
			() => resolve(true),
			keys => resolve(false),
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

exports.check_user_credentials = function credential_check_promise(arangoDB, username, password) {
	arangoDB.useDatabase('user_db');
	return new Promise(resolve => {
		arangoDB.query('FOR u IN userCollection FILTER u.uname == @name SORT u.uname ASC RETURN u.salt', {'name':username, 'pass':password}).then(
	  		cursor => cursor.all()
		).then(
			() => resolve(false),
	  		keys => {
	  			if (keys.length != 1) {
	  				console.log("improper number of users with username " + username);
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
	  				() => {
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
	  				},
					keys => resolve('name in use'),
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
			() => {
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
			},
			keys => {console.log('Attempt to add initial user to existsing DB'); resolve(false)},
	  		err => {console.error('Failed to execute query:', err); resove(false)}
		);
		// reject(Error("Error checking user credentials"))
	});
}

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

/*
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