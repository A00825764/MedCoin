
const example = async (req, res) => {
    const { data } = req.body;
    if(data == 1){
        return res.status(200).json('One');
    } else if(data == 0){
        return res.status(200).json('Zero');
    } else {
        return res.status(400).json('Error');
    }
};

module.exports = { example }