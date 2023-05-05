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
    helpers: {
        json:  (obj) => {return JSON.stringify(obj)},
        img: (name) =>{
            let icons = getAllIcons()
            const lastIndex = name.lastIndexOf(".")
            const filepath = path.join(__dirname, "files",name)
            if(fs.lstatSync(filepath).isDirectory())
            {
                return path.join('gfx','icons', "dir.png")
            }
            else if(icons.includes(name.slice(lastIndex).toLowerCase()))
            {
                return path.join('gfx','icons', name.slice(lastIndex+1).toLowerCase() + ".png")
            }
            else{
                return path.join('gfx','icons', "file.png")
            }
        }
    },
    extname: '.hbs',
    partialsDir: "views/partials"
}));
app.set('view engine', 'hbs');
app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());

let context = {
    "title": "filemanager",
    "files": []
}

app.get("/", function (req, res) {
    context.files = getAllFiles()
    getAllIcons()
    res.render('hero-page.hbs', context);   // nie podajemy ścieżki tylko nazwę pliku
})

app.post('/upload', function (req, res) {
    let form = formidable.IncomingForm();
    form.uploadDir = FILES_DIRECTORY  
    form.multiples = true;
    form.keepFilenames = true;  
    form.keepExtensions = true;
    form.on ('fileBegin', function(name, file){
        file.path = form.uploadDir + (file.name).trim();        
        while(fs.existsSync(file.path))
        {
            const lastIndex = (file.path).lastIndexOf(".")
            file.path = (file.path).slice(0, lastIndex).trim() + "_kopia" + (file.path).slice(lastIndex) 
        }
    })

    form.parse(req,function (err, fields, files) {
   
        console.log("-----------------")
        if(Array.isArray(files.filetoupload))
        {
            files.filetoupload.forEach(f =>{
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
    res.redirect("/") 
});


app.post("/upload/dir", function (req, res) {
    const filepath = path.join(__dirname, "files", req.body.value)
    if (!fs.existsSync(filepath)) {
        fs.mkdir(filepath, (err) => {
            if (err) throw err
            console.log("jest");
        })
    }
    res.redirect("/")
})
app.post("/upload/txt", function (req, res) {
    const filepath = path.join(__dirname, "files", `${(req.body.value).trim()}.txt`)
    fs.writeFile(filepath, `Nowy dokument tekstowy utworzony: ${new Date(Date.now()).toDateString()}`, (err) => {
        if (err) throw err
    })   
    
    res.redirect("/")
})

app.get("/file/:id", function (req, res) {
    let id = req.params.id
    const filepath = path.join(__dirname, "files", id)
    if (fs.existsSync(filepath)) {
        const lastIndex = filepath.lastIndexOf(".")
        res.type(filepath.slice(lastIndex))
        res.sendFile(filepath)
        // res.download(filepath) // to ci pobiera pliczek tak jak chcesz
     } else {
         console.log("plik nie istnieje");
         res.status(404).redirect("/")
     }
});

app.post("/remove", function (req, res) {
    let body = req.body
    const filepath = path.join(__dirname, "files", body[Object.keys(body)[0]])
    if (fs.existsSync(filepath)) {
        fs.unlink(filepath,  (err) =>{
            console.log("deleted");
        })
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

function getAllIcons()
{
    const filepath = path.join(__dirname, "static",'gfx','icons')
    const files = fs.readdirSync(filepath);
    const response = [];
    for (let file of files) {
        const lastIndex = file.lastIndexOf(".")
        response.push("."+ file.slice(0,lastIndex));
    }
    return response;
}


app.use(express.static('static'));
app.listen(PORT, function () {
    console.log("start serwera na porcie " + PORT)
})