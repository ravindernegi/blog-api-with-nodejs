const PageModel = require('../models/page');
const connectToDatabase = require('../helpers/db');
const { pageMeta, validate, verifyToken } = require('../helpers/common');

// Get all pages
const getAllPage = async (req,res,next) => {
    const dbCon = await connectToDatabase();
    try {
        let query = {};
        query.is_deleted = false;

        let page = req.query.page?parseInt(req.query.page):1;
        let limit =  req.query.limit?parseInt(req.query.limit):10;
        let start = ((page - 1) * limit) ;
        if(req.params.search){
            query['$or'] = [
                {email:{"$regex": req.query.search, "$options": "i"}},
                {first_name:{"$regex": req.query.search, "$options": "i"}},
                {last_name:{"$regex": req.query.search, "$options": "i"}}
            ];
        }
        const list =  await PageModel.aggregate([
            {'$match': query},
            {'$skip': start},
            {'$limit': limit},
            {'$sort': {
                'title': 1
            }}
        ]).exec();
        let total = await PageModel.countDocuments(query);
        let page_meta = await pageMeta(total,page,limit);
        return res.send({status:true, data:{ list:list, meta:page_meta }});
	} catch (error) {
        dbCon.close()
		next(error);
	}
};

// Get by page iD
const getPageById = async (req,res,next) => {
    const dbCon = await connectToDatabase();
    try {
		let rules = {
			id: 'required',
        };
        const isValid = validate(req.params, rules, res);
		if (isValid) {
		   return isValid
		}
        PageModel.findById(req.params.id)
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

// Add new page
const createPage = async (req,res,next) => {
    const dbCon = await connectToDatabase();
    try {
        const auth = await verifyToken(req,res,next);
        req.body.user_id = auth.user._id;
		let rules = {
			user_id: 'required',
			title: 'required',
            slug: 'required',
            status: 'required'
		};
		// check validation
		const isValid = validate(req.body, rules, res);
		if (isValid) {
			return isValid;
		}
		const page = await PageModel.findOne({slug : req.body.slug}).exec();
		if(page){
		  throw {slug: 'Page Already exist'}
		  return;
		}
        PageModel.create(req.body)
            .then(item => res.send(item)).then((data)=>{
                res.send(data);
                dbCon.close();
            }).catch(err =>{
                console.log(err);
                dbCon.close();
                next(err);
            });
    } catch (error) {
        console.log("Page error", error);
        dbCon.close();
        next(error);
    }
};

// update page
const updatePage = async (req,res,next) => {
    const dbCon = await connectToDatabase();
    try {
        const auth = await verifyToken(req,res,next);
        req.body.user_id = auth.user._id;
		let rules = {
			user_id: 'required',
			title: 'required',
            slug: 'required',
            status: 'required'
        };
        // check validation
		const isValid = validate(req.body, rules, res);
		if (isValid) {
			return isValid;
        }        
        const pagedata = await PageModel.findById({
            _id: req.params.id
        }, {created_at: 0}).exec();
        const page = await PageModel.findOne({slug : req.body.slug}).exec();
		if(page && page.slug !== pagedata.slug){
		  throw {slug: 'Page Already exist'}
		  return;
		}
        pagedata.title = req.body.title
        pagedata.slug = req.body.slug;
        pagedata.status = req.body.status;
        pagedata.description = req.body.description;
        let save = await pagedata.save();
        res.send({status:true, data: {todo:"success"}});
        dbCon.close()
    } catch(err){
        dbCon.close()
		next(err);
    }
};

// Delete by page id
const removePage = async (req,res,next) => {
    const dbCon = await connectToDatabase();
    try{
       const pagedata = await PageModel.deleteMany({ _id: req.body.ids });
       dbCon.close();
       return res.send({status:true,data : {user:"success"}})
    }catch(err){
        dbCon.close()
		next(err);
    }
};

module.exports = {
    getAllPage,
    getPageById,
    createPage,
    updatePage,
    removePage
};