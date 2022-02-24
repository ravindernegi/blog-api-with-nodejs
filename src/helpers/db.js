/* For MongoDb Connection */
const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

mongoose.connection.on('connected', () => {
    console.log('Connection Established');
});

mongoose.connection.on('reconnected', () => {
    console.log('Connection Reestablished');
});

mongoose.connection.on('disconnected', () => {
    console.log('Connection Disconnected');
});

mongoose.connection.on('close', () => {
    console.log('Connection Closed');
});

mongoose.connection.on('error', (error) => {
    console.log('ERROR: ' + error);
});

const connectToDatabase = async () => {
    try {
        await mongoose.connect(
            process.env.DB_CONNECTION, {
                useNewUrlParser: true,
                poolSize: 50,
                useUnifiedTopology:true
            }
        );
        const db = mongoose.connection;
        return Promise.resolve(db);

    } catch (error) {
        console.log(error);
        return Promise.reject(error);
    }
};

module.exports = connectToDatabase
