const UserModel = require('../models/user');
const connectToDatabase = require('../helpers/db');
const { validate, pageMeta, verifyToken } = require('../helpers/common');

// Get all users
const getAllUser = async (req,res,next) => {
    const dbCon = await connectToDatabase();
    try {
        const auth = await verifyToken(req, res, next);
        let query = {};
        query.is_deleted = false;
        //query._id = {"$nq": Object.id(auth.user._id)};
        //query['$and'] = [{"_id":{"$nin":[auth.user._id]}}];

        let page = req.query.page?parseInt(req.query.page):1;
        let limit = req.query.limit ? parseInt(req.query.limit):10;
        let start = ((page - 1) * limit) ;
        if(req.params.search){
            query['$or'] = [
                {email:{"$regex": req.query.search, "$options": "i"}},
                {first_name:{"$regex": req.query.search, "$options": "i"}},
                {last_name:{"$regex": req.query.search, "$options": "i"}}
            ];
        }
        const list = await UserModel.aggregate([
            {'$match': query},
            {'$skip': start},
            {'$limit': limit},
            {'$sort': {
                'title': 1
            }}
        ]).exec();
        let total = await UserModel.countDocuments(query);
        let page_meta = await pageMeta(total, page, limit);
        return res.send({status:true, data:{ list: list, meta: page_meta }});
	} catch (error) {
        dbCon.close()
		next(error);
	}
};

// Get by user iD
const getUserById = async (req,res,next) => {
    const dbCon = await connectToDatabase();
    try {
        const auth = await verifyToken(req, res, next);
		let rules = {
			id: 'required',
        };
        const isValid = validate(req.params, rules, res);
		if (isValid) {
            return isValid
		}
        UserModel.findById({
            _id: req.params.id
        }, {password: 0, __v: 0, created_at: 0}).exec()
            .then(item => res.send(item)).then(()=>{
                dbCon.close();
            }).catch(err =>{
                dbCon.close()
                next(err)
            })
	} catch (error) {
        dbCon.close()
		next(error);
	}
};

// Add new user
const createUser = async (req,res,next) => {
    const dbCon = await connectToDatabase();
    try {
        const auth = await verifyToken(req, res, next);
		let rules = {
            username: 'required',
            email: 'required|email',
            first_name: 'required',
            last_name: 'required',
            password:'required',
            status:'required',
            role:'required'
		};
		// check validation
		const isValid = validate(req.body, rules, res);
		if (isValid) {
			return isValid;
		}
        const user = await UserModel.findOne({$or: [{'email': req.body.email}, {'username': req.body.username}]}).exec();
		if(user && user.email === req.body.email){
		    throw {email: "User Email Already exist"}
		    return
        }
        if(user && user.username === req.body.username){
		    throw {username: "User Name Already exist"}
		    return
		}
        UserModel.create(req.body)
            .then(item => res.send(item)).then(()=>{
                dbCon.close();
            }).catch(err =>{
                dbCon.close();
                next(err);
            });
    } catch (error) {
        dbCon.close();
        next(error);
    }
};

// update user
const updateUser = async (req, res, next) => {
    const dbCon = await connectToDatabase();
    try{
        const auth = await verifyToken(req,res,next);
        let rules = {
            username: 'required',
            email: 'required|email',
            first_name: 'required',
            last_name: 'required',
            status:'required',
            role:'required'
		};
		// check validation
		const isValid = validate(req.body, rules, res);
		if (isValid) {
			return isValid;
		}
        const userdata = await UserModel.findById({
            _id: req.params.id
        }, {password: 0, __v: 0, created_at: 0}).exec();
        userdata.first_name = req.body.first_name
        userdata.last_name = req.body.last_name;
        userdata.status = req.body.status;
        userdata.phone = req.body.phone;
        userdata.role = req.body.role;
        let save = await userdata.save();
        res.send({status:true, data: {todo:"success"}});
        dbCon.close()
    }catch(err){
        dbCon.close()
		next(err);
    }
};

// Delete by user id
const removeUser = async (req, res, next) => {
    const dbCon = await connectToDatabase();
    try{
        const auth = await verifyToken(req, res, next);
        //const userdata = await UserModel.updateOne({ _id: req.params.id },{$set: {status: 'inactive', is_deleted: true}});
        const userdata = await UserModel.deleteMany({ _id: req.body.ids });
        dbCon.close();
        return res.send({status: true, data :{user:"success"}})
    }catch(err){
        dbCon.close()
		next(err);
    }
};

module.exports = {
    getAllUser,
    getUserById,
    createUser,
    updateUser,
    removeUser
};