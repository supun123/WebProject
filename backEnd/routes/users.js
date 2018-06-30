var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var jwt = require('jsonwebtoken');
var User = require('../models/user');

// Register
router.get('/register', function (req, res) {
	res.render('register');
});

// Login
router.get('/login', function (req, res) {
	res.render('login');
});

// Register User
router.post('/register', function (req, res) {
	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;

	// Validation
/*	req.checkBody('name', 'Name is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

	var errors = req.validationErrors();

	if (errors) {
		res.render('register', {
			errors: errors
		});
	}
	else {*/
		//checking for email and username are already taken
		User.findOne({ username: { 
			"$regex": "^" + username + "\\b", "$options": "i"
	}}, function (err, user) {
			User.findOne({ email: { 
				"$regex": "^" + email + "\\b", "$options": "i"
		}}, function (err, mail) {
				if (user || mail) {

				/*	res.render('register', {
						user: user,
						mail: mail
					});*/
					res.status(501).json({massage:'User name or mail already exist'});
					console.log('User name or mail already exist');
				}
				else {
					var newUser = new User({
						name: name,
						email: email,
						username: username,
						password: password
					});
					User.createUser(newUser, function (err, user) {
						if (err){ res.status(501).json({massage:'Error registering user'});
                            console.log('Error registering user');}
						console.log(user);
					});
					res.status(201).json(user);
                    console.log('201');
                    /*
                 req.flash('success_msg', 'You are registered and can now login');
                        res.redirect('/users/login');
                        */
				}
			});
		});
	//}
});

passport.use(new LocalStrategy(
	function (username, password, done) {
		User.getUserByUsername(username, function (err, user) {
			if (err) throw err;
			if (!user) {
				return done(null, false, { message: 'Unknown User' });
			}

			User.comparePassword(password, user.password, function (err, isMatch) {
				if (err) throw err;
				if (isMatch) {
					return done(null, user);
				} else {
					return done(null, false, { message: 'Invalid password' });
				}
			});
		});
	}));

passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(function (id, done) {
	User.getUserById(id, function (err, user) {
		done(err, user);
	});
});

router.post('/login',function (req, res) {
	const username=req.body.username;
	const password=req.body.password;
	console.log(username,password);
    isValid(username,password,function (user,valid) {
        if (valid){
     		//generate token
			//console.log('generate token');
            var token = jwt.sign({ username:user.username }, 'secret',{expiresIn:'3h'});
           // console.log(token);
            res.status(200).json(token);
        }
        else{
            console.log('Username or password invalid');
            res.status(501).json({massage:'Username or password invalid '})
        }
    });


	});
function  isValid(username,password,callback){
    User.getUserByUsername(username, function (err, user) {
        if (err) {//console.log('A');
            callback(null,false);
        //return false;
            }
        if (!user) {
            //console.log('B');
            //return false;
            callback(null,false);
        }

        User.comparePassword(password, user.password, function (err, isMatch) {
            if (err) {
              //  console.log('c');
                //return false;
                callback(null,false);
                }
            if (isMatch) {
                //console.log('d');
                //return true;
                callback(user,true);

            } else {
                //console.log('e');
                //return false;
                callback(null,false);

            }
        });
    });
}

router.get('/getusername',veryfyToken,function (req, res,next) {
	//console.log(decodeToken.username);
return res.status(200).json(decodeToken.username);
});
var decodeToken='';
function veryfyToken(req,res,next) {
	var token =req.rawHeaders[7].toString();
	token=token.replace(/^"(.*)"$/, '$1');
	jwt.verify(token,'secret',function (err,tokendata) {
	if (err){
		//console.log(err);
		return res.status(400).json({message:'Unathorized request'})
	}
	if (tokendata){
		decodeToken=tokendata;
		next();
	}
})
}
router.get('/logout', function (req, res) {
	req.logout();

	req.flash('success_msg', 'You are logged out');

	res.redirect('/users/login');
});

module.exports = router;