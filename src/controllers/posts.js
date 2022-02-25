const PostModel = require('../models/post');
const connectToDatabase = require('../helpers/db');
const { pageMeta, validate, verifyToken } = require('../helpers/common');

// Get all posts
const getAllPost = async (req, res, next) => {
  const dbCon = await connectToDatabase();
  try {
    let query = {};
    query.is_deleted = false;

    let page = req.query.page ? parseInt(req.query.page) : 1;
    let limit = req.query.limit ? parseInt(req.query.limit) : 10;
    let start = (page - 1) * limit;
    if (req.params.search) {
      query['$or'] = [
        { email: { $regex: req.query.search, $options: 'i' } },
        { first_name: { $regex: req.query.search, $options: 'i' } },
        { last_name: { $regex: req.query.search, $options: 'i' } },
      ];
    }
    const list = await PostModel.aggregate([
      { $match: query },
      { $skip: start },
      { $limit: limit },
      {
        $sort: {
          title: 1,
        },
      },
    ]).exec();
    let total = await PostModel.countDocuments(query);
    let page_meta = await pageMeta(total, page, limit);
    return res.send({ status: true, data: { list: list, meta: page_meta } });
  } catch (error) {
    dbCon.close();
    next(error);
  }
};

// Get by post iD
const getPostById = async (req, res, next) => {
  const dbCon = await connectToDatabase();
  try {
    let rules = {
      id: 'required',
    };
    const isValid = validate(req.params, rules, res);
    if (isValid) {
      return isValid;
    }
    PostModel.findById(req.params.id)
      .then((item) => res.send(item))
      .then(() => {
        dbCon.close();
      })
      .catch((err) => {
        dbCon.close();
        next(err);
      });
  } catch (error) {
    dbCon.close();
    next(error);
  }
};

// Add new post
const createPost = async (req, res, next) => {
  const dbCon = await connectToDatabase();
  try {
    const auth = await verifyToken(req, res, next);
    req.body.user_id = auth.user._id;
    let rules = {
      user_id: 'required',
      title: 'required',
      slug: 'required',
      status: 'required',
    };
    // check validation
    const isValid = validate(req.body, rules, res);
    if (isValid) {
      return isValid;
    }
    const page = await PostModel.findOne({ slug: req.body.slug }).exec();
    if (page) {
      throw { slug: 'Page Already exist' };
      return;
    }
    PostModel.create(req.body)
      .then((item) => res.send(item))
      .then((data) => {
        res.send(data);
        dbCon.close();
      })
      .catch((err) => {
        console.log(err);
        dbCon.close();
        next(err);
      });
  } catch (error) {
    console.log('Page error', error);
    dbCon.close();
    next(error);
  }
};

// update post
const updatePost = async (req, res, next) => {
  const dbCon = await connectToDatabase();
  try {
    const auth = await verifyToken(req, res, next);
    req.body.user_id = auth.user._id;
    let rules = {
      user_id: 'required',
      title: 'required',
      slug: 'required',
      status: 'required',
    };
    // check validation
    const isValid = validate(req.body, rules, res);
    if (isValid) {
      return isValid;
    }
    const pagedata = await PostModel.findById(
      {
        _id: req.params.id,
      },
      { created_at: 0 }
    ).exec();
    const page = await PostModel.findOne({ slug: req.body.slug }).exec();
    if (page && page.slug !== pagedata.slug) {
      throw { slug: 'Page Already exist' };
      return;
    }
    pagedata.title = req.body.title;
    pagedata.slug = req.body.slug;
    pagedata.status = req.body.status;
    pagedata.description = req.body.description;
    let save = await pagedata.save();
    res.send({ status: true, data: { todo: 'success' } });
    dbCon.close();
  } catch (err) {
    dbCon.close();
    next(err);
  }
};

// Delete by post id
const removePost = async (req, res, next) => {
  const dbCon = await connectToDatabase();
  try {
    const pagedata = await PostModel.deleteMany({ _id: req.body.ids });
    dbCon.close();
    return res.send({ status: true, data: { user: 'success' } });
  } catch (err) {
    dbCon.close();
    next(err);
  }
};

module.exports = {
  getAllPost,
  getPostById,
  createPost,
  updatePost,
  removePost,
};
