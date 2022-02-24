const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const PageSchema = new Schema({
    user_id : {
        type: Schema.Types.ObjectId, ref: 'Users',
        required: true
    },
    title: {
        type: String,
        trim: true
    },
    slug: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },    
    status: {
        type: String,
        enum: ["active", "inactive", "archived"],
        default: 'active'
    },
    is_deleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

mongoose.set("useCreateIndex", true);
module.exports = mongoose.model("Pages", PageSchema);