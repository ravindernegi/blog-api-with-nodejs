const Validator = require('validatorjs');
const slugifyModule = require('./slugify');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");
const ErrorMsg = require('../helpers/message/error');

/** Common Function for Validation  **/
const validate = (event, rules, res) => {
	Validator.register('telephone', function (value, requirement, attribute) {
		return value.match(/^\D?\d{3}-\D?\D?(\d{3})\D?(\d{4})$/);
	}, 'The :attribute phone number is not in the format e.g. 324-234-3243');

	// Rule for image format (jpg, png, jpeg)
	Validator.register('image_format', function (value, requirement, attribute) {
		let imageTypes = ['image/jpg', 'image/png', 'image/jpeg'];
		return imageTypes.includes(value);
	}, 'Only these file types are accepted : jpg, png, jpeg');

	// Rule for image size
	Validator.register('image_size_5MB', function (value, requirement, attribute) {
		if (parseInt(value) < parseInt(5 * 1024 * 1024)) {
			return true;
		}
	}, 'File must be less then 5MB');

	let validation = new Validator(event, rules);

	if (validation.fails()) {
		let errors = {};
		let error = {};
		Object.keys(validation.errors.errors).map((val) => {
			error = { ...error, [val]: validation.errors.errors[val][0] };
		});
		errors = error;
		return res.status(422).json({
			status: false,
			errors: errors
		});
	} else {
		return false;
	}
}

/** For Create Alise  **/
const slugify = (title) => {
	return slugifyModule(title, {
		lower: true,
		remove: /[?*+~.()={}_/'"!:@`;,^%#`]/g
	});
}

/** middlewares **/
const checkApiKey = (req, res, next) => {
	let error = '';
	if (!req.headers['api-key']) {
		error = ErrorMsg.api_key_empty;
		return res.status(403).json({
			status: false,
			"errors": { error: error }
		});
	} else if (req.headers['api-key'] != process.env.API_KEY) {
		error = ErrorMsg.api_invalid;
		return res.status(403).json({
			status: false,
			"errors": { error: error }
		});
	}
	next();
}

const checkAuth = (req, res, next) => {
	let token = req.headers['authorization'];
	if (token) {
		try {
			jwt.verify(token, process.env.SECRET);
			next();
		} catch (err) {
			throw ({ error: err });
		}
	} else {
		throw ({ error: ErrorMsg.token_empty });
	}
}

// verify token and get auth user_id
const verifyToken = (req, res, next) => {
	let token = req.headers['authorization'];	
	if (token) {
		try {
			return jwt.verify(token, process.env.SECRET);
		} catch (err) {
			throw ({ error: err });
		}
	} else {
		throw ({ error: ErrorMsg.token_empty });
	}
}

// verify refresh token and get auth user_id
const verifyRefreshToken = (req, res, next) => {
	let token = req.headers['authorization'];
	if (token) {
		try {
			return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
		} catch (err) {
			throw ({ error: err });
		}
	} else {
		throw ({ error: ErrorMsg.token_empty });
	}
}

//Generate Password
const generatePassword = (length = 8, charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") => {
	return new Array(length)
		.fill(null)
		.map(() => charset.charAt(Math.floor(Math.random() * charset.length)))
		.join('');
}

//Hash Password with bcrypt
const hashCode = async (token) => {
	return new Promise(function (resolve) {
		bcrypt.genSalt(10).then(salt => {
			return salt;
		}).then(salt => {
			return bcrypt.hash(token, salt);
		}).then(hash => {
			resolve(hash);
		});
	});
};

// generate auth token
const generateAuthToken = (user) => {
	const token = jwt.sign({
		user: user,
	}, process.env.SECRET, {
		expiresIn: process.env.TOKEN_LIFE
	});
	const refreshToken = jwt.sign({
		user: user,
	}, process.env.REFRESH_TOKEN_SECRET, {
		expiresIn: process.env.REFRESH_TOKEN_LIFE
	});
	userMetaData = {
		'_id': user._id,
		'email': user.email,
		'first_name': user.first_name,
		'last_name': user.last_name,
		'phone': user.phone,
		'role': user.role,
		'status': user.status,
		'username': user.username,
	}
	const response = {
		user:userMetaData,
		token: token,
		expired_at: process.env.TOKEN_LIFE,
		refresh_token: refreshToken
	};
	return response;
}

// page meta
const pageMeta = (total, page = 1, limit = 10) => {
	let metadata = {};
	metadata.current = page;
	metadata.next = (page * limit) < total ? page + 1 : 0;
	metadata.limit = limit;
	metadata.total_items = total;
	metadata.total_page = (total > 0) ? Math.ceil(total / limit) : 0;
	return metadata;
}

module.exports = {
	validate,
	slugify,
	checkApiKey,
	checkAuth,
	verifyToken,
	verifyRefreshToken,
	generatePassword,
	hashCode,
	generateAuthToken,
	pageMeta
}