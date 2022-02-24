const bcrypt = require('bcrypt');
const UserModel = require('../models/user');
const connectToDatabase = require('../helpers/db');
const UserMsg = require('../helpers/message/user');
const {generateAuthToken, validate, verifyToken, verifyRefreshToken} = require('../helpers/common');
const ErrorMsg = require('../helpers/message/error');

// Auth's login
const login = async (req, res, next) => {
	const dbCon = await connectToDatabase();
	try {
		let username = req.body.username,
		password = req.body.password;

		// validation rules
		let rules = {
			username: 'required',
			password: 'required'
		};
		// check validation
		const isValid = validate(req.body, rules, res);
		if (isValid) {
			return isValid;
		}
		const user = await UserModel.findOne({
			username,
			status:'active'
		}, {created_at: 0, updated_at: 0}).exec();
		dbCon.close();

		if(user===null){
			throw ({username: UserMsg.user_not_found});
		}
		if (user && bcrypt.compareSync(password, user.password)) {			
			const response = generateAuthToken(user);
		 	res.send({status: true, data: response});
		} else {
			throw ({username: UserMsg.wrong_info});
		}
	} catch (error) {
        dbCon.close()
		next(error);
	}
};

// Forgotpassword
const forgotpassword = async (req, res, next) => {
	const dbCon = await connectToDatabase();
	try {
		let username = req.body.username;
		// validation rules
		let rules = {
			username: 'required'
		};
		// check validation
		const isValid = validate(req.body, rules, res);
		if (isValid) {
			return isValid;
		}
		const user = await UserModel.findOne({
			username,
			status:'active'
		}, {password: 0, created_at: 0, updated_at: 0}).exec();
		if (user) {
			var length = 8,
				charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
				retVal = "";
			for (var i = 0, n = charset.length; i < length; ++i) {
				retVal += charset.charAt(Math.floor(Math.random() * n));
			}

			user.password = retVal;
			await user.save(); //update password
			dbCon.close();
			res.send({status: true, data: {newPassword: retVal}});
		} else{
			dbCon.close();
			throw ({username: UserMsg.user_not_found});
		}
		res.send({status: true, data: user});
	} catch (error) {
		dbCon.close();
		next(error);
	}
}

// Logout
const logout = async (req, res, next) => {
	try {
		verifyToken(req, res, next);
		res.send({status:true, data:ErrorMsg.success});
	} catch (error) {
		next(error);
	}
}

// Get logged in user details
const getAuthUser = async (req,res,next) => {
	const dbCon = await connectToDatabase();
	try {
		const auth = await verifyToken(req, res, next);
		let id = auth.user._id;
		const user = await UserModel.findOne({
			_id:id,
			status:'active'
		}, {password:0}).exec();
		dbCon.close();
		res.send({status:true,data:{user:user}});
	} catch (error) {
		dbCon.close();
		next(error);
	}
}

// Refresh auth token
const refreshToken = async (req, res, next) => {
	try {
		const auth = await verifyRefreshToken(req, res, next);
		const response = generateAuthToken(auth);
		res.send({status: true, data: response});
	} catch (error) {
		next(error);
	}
}

// Update profile
const updateProfile = async (req,res,next) => {
    const dbCon = await connectToDatabase();
    try {
		const auth = await verifyToken(req, res, next);
		let id = auth.user._id;
        let params = req.body;
		let rules = {
            phone: 'telephone',
			email: 'email'
		};
		// check validation
		const isValid = validate(req.body, rules, res);
		if (isValid) {
			return isValid;
		}
        // check for already exist
        const userdata = await UserModel.findOne({
            '$or': [
                {
                    _id: id
				},
				{
                	email: params.email
            	}
            ]
        }, {email:1}).exec();
        let messages = {};
        let error = false;
        if(userdata){
            if(userdata && userdata.email==params.email && userdata._id!=id){
                messages.email =  UserMsg.email_exists;
                error = true;
            }
        }

        if(error){
            dbCon.close();
            res.send({status:false,errors : messages});
        }
        if(Object.keys(params).length>0){
            await UserModel.updateOne({ _id: id },{ $set: params});
        }
        dbCon.close();
        res.send({status: true, data: {user: "success"}});

	} catch (error) {
        dbCon.close();
		next(error);
	}
};

// Change password
const changePassword = async (req, res, next) => {
	const dbCon = await connectToDatabase();
	try {
		const auth = await verifyToken(req, res, next);
		let id = auth.user._id;
		let old_password = await req.body.old_password;
		let password = req.body.password;
		let rules = {
			old_password: 'required',
			password: 'required'
		};
		// check validation
		const isValid = validate(req.body, rules, res);
		if (isValid) {
			return isValid;
		}
		const user = await UserModel.findOne({_id: id}).exec();
		if (user && bcrypt.compareSync(old_password, user.password)) {
			user.password = password;
			await user.save(); //update password
			dbCon.close();
			res.send({status: true, data: {user:"success"}});
		} else{
			dbCon.close();
			throw ({"old_password": UserMsg.old_password});
		}
	} catch (error) {
		dbCon.close();
		next(error);
	}
}

module.exports = {
	login,
	forgotpassword,
	logout,
	getAuthUser,
	refreshToken,
	updateProfile,
	changePassword
}