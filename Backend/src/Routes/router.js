
const getting = require('./getting')
const posting = require('./posting')

module.exports = (app) => {
    app.use('/path1', getting),
    app.use('/path2', posting)
}

