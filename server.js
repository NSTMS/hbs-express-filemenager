const express = require("express");
const request = require("request")
const app = express()
const PORT = 3000;
const path = require("path")
const hbs = require('express-handlebars');
const fs = require('fs');
const formidable = require('formidable');
const FILES_DIRECTORY = __dirname + "\\files\\"

app.set('views', path.join(__dirname, 'views'));
app.engine('hbs', hbs({
    defaultLayout: 'main.hbs',
    helpers: {},
    extname: '.hbs',
    partialsDir: "views/partials"
}));
app.set('view engine', 'hbs');
app.use(express.urlencoded({
    extended: true
}));

let context = {
    "title": "filemanager",
    "files": []
}

app.get("/", function (req, res) {
    context.files = getAllFiles()
    res.render('hero-page.hbs', context);   // nie podajemy ścieżki tylko nazwę pliku
})

app.post('/upload', function (req, res) {
    let form = formidable.IncomingForm();
    form.uploadDir = FILES_DIRECTORY  
    form.multiples = true;
    form.keepFilenames = true;  
    form.keepExtensions = true;
    form.on ('fileBegin', function(name, file){
        // add check if file exist bo nie ma tego narazie

        file.path = form.uploadDir + "/" + file.name;
    })

    form.parse(req,function (err, fields, files) {
   
        console.log("-----------------")
        if(Array.isArray(files.filetoupload))
        {
            files.filetoupload.forEach(f =>{
                console.log(f)
                context.files.push({
                    name : f.name,
                    type: f.type,
                    size  : f.size
                })
            })
        }
        else{
            context.files.push({
                name : files.filetoupload.name,
                type: files.filetoupload.type,
                size  : files.filetoupload.size
            })
        }
    });
    res.render('hero-page.hbs', context);   // nie podajemy ścieżki tylko nazwę pliku
});

app.get("/file/:id", function (req, res) {
    let id = req.params.id
    console.log(id)
    const files = allFiles()
    const filepath = path.join(__dirname, "files", id)
    if (fs.existsSync(filepath)) {
        console.log("plik istnieje");
     } else {
         console.log("plik nie istnieje");
     }

    res.redirect("/")

});


function getAllFiles()
{
    const filepath = path.join(__dirname, "files")
    const files = fs.readdirSync(filepath, 'utf8');
    const response = [];
    for (let file of files) {
        const extension = path.extname(file);
        const fileSizeInBytes = fs.statSync(filepath + '/' + file).size;
        response.push({ name: file, "type": extension, "size":fileSizeInBytes });
    }
    return response;
}



app.use(express.static('static'));
app.listen(PORT, function () {
    console.log("start serwera na porcie " + PORT)
})