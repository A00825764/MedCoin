const path = require('path')

const login = async (req, res) => {
    const {  } = req.body;
    res.sendFile(path.resolve(__dirname + '/../../../Frontend/html/index.html'));
};

module.exports = { login }