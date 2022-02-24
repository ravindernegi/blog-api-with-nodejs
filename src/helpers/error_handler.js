const errorHandler = (err, req, res, next) => {
	console.log('err',err);
	// Errors Object
	if (err.errors) {
		let errors = err.errors;
		errFields = [];

		for (let obj in errors) {
			let errMsg = null;

			if (errors[obj].hasOwnProperty("properties")) {
				errMsg = {name:errors[obj].properties.name,message:errors[obj].properties.message};
				errFields.push(errMsg);
			} else {
				errMsg = {name:errors[obj].name,message:errors[obj].message};
				errFields.push(errMsg);
			}
		}
		return res.status(422).json({
			status:false,
			errors: errFields
		});
	}	

	// Mongodb Error
	if (err.name === "MongoError") {
		//var field = err.message.split(".$")[1];
		//field = field.split(" dup key")[0];
		//field = field.substring(0, field.lastIndexOf("_"));
		return res
			.status(422)
			.json({
				status:false,
				errors: {
					type:'mongo-error',
					error:err.message
				},
				//field: field
			});
	}

	// Validation Error
	if (err.name === "ValidationError") {
		return res.status(422).json({
			status:false,
			errors: err.message
		});
	}

	// Token Error
	if (err.name === "UnauthorizedError") {
		return res.status(403).json({
			status:false,
			errors: err.message
		});
	}

	// Error with string
	if (typeof err === "string" || typeof err === "object") {
		return res.status(422).json({
			status:false,
			errors: err
		});
	}
	// default to 500 server error
	return res.status(500).json({
		status:false,
		errors: err.message
	});
};

module.exports = errorHandler;