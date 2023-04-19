const express = require("express");
const app = express()
const PORT = 3000;
const path = require("path")
const hbs = require('express-handlebars');
const fsPromises = require("fs").promises
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


const context = {
    "title": "filemanager"
}

app.get("/", function (req, res) {
    res.render('hero-page.hbs', context);   // nie podajemy ścieżki tylko nazwę pliku
})


app.use(express.static('static'));
app.listen(PORT, function () {
    console.log("start serwera na porcie " + PORT)
})

app.post('/upload', function (req, res) {
    let form = formidable.IncomingForm();
    form.uploadDir = FILES_DIRECTORY  
    
    form.multiples = true;
    form.keepFilenames = true;  
    form.keepExtensions = true;

    form.parse(req,async function (err, fields, files) {
     console.log(await renameFile(files.filetoupload.path, FILES_DIRECTORY + files.filetoupload.name)) 
    });

    dirs()
    res.render('hero-page.hbs', context);
});
const renameFile = async (file_path, name) =>{
    return fs.existsSync(file_path)
    // fs.rename(file.path, form.uploadDir + "/" + file.name);

}
const dirs = async () => {
    try {
        const files = await fsPromises.readdir(FILES_DIRECTORY)
        for (let file of files) {
            const stat = await fsPromises.lstat(FILES_DIRECTORY + file)
        }
    } catch (error) {
        console.log(error);
    }



}

