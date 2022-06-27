const multer = require('multer')

const storage = multer.diskStorage({
    destination: function(request,response,next){
        next(null, "uploads")
    },
    filename: function(request,file,next){
        next(null, Date.now() + "-" + file.originalname)
    }
})

const upload = multer({storage})

module.exports = upload