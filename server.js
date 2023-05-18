const express = require("express");
const app = express()
const PORT = 3000;
const path = require("path")
const hbs = require('express-handlebars');
const fs = require('fs');
const formidable = require('formidable');
let FILES_DIRECTORY = __dirname + "\\files\\"

app.set('views', path.join(__dirname, 'views'));
app.engine('hbs', hbs({
    defaultLayout: 'main.hbs',
    helpers: {
        json:  (obj) => {return JSON.stringify(obj)},
        img: (name) =>{
            let icons = getAllIcons()
            const lastIndex = name.lastIndexOf(".")
            const filepath = path.join(FILES_DIRECTORY,name)
            if(fs.lstatSync(filepath).isDirectory())
            {
                return "http://localhost:3000/gfx/icons/dir.png"
            }
            else if(icons.includes(name.slice(lastIndex).toLowerCase()))
            {
                return "http://localhost:3000/gfx/icons/"+ name.slice(lastIndex+1).toLowerCase() + ".png"
            }
            else{
                return "http://localhost:3000/gfx/icons/file.png"
            }
        },
        link: (link) =>{
            let route = link
            if(route.endsWith("/")) route = route.slice(0, -1);
            let res = ""
            let prev = ""
            for(c of route.split("/"))
            {
                if(c == "") res += `<a href="/"> home</a> `
                else{
                    prev += "/" + c
                    if(prev.startsWith("/")) prev = prev.slice(1)
                    res += `/ <a href="/${prev}">${c}</a> `
                }
            }
            return res
        },   
        isDir: (name) =>{
            const filepath = path.join(FILES_DIRECTORY,name)
            return fs.lstatSync(filepath).isDirectory()
        }
    },
    extname: '.hbs',
    partialsDir: "views/partials"
}));
app.set('view engine', 'hbs');
app.use(express.urlencoded({
    extended: true
}));
app.use(express.static('static'));
app.use(express.json());

let context = {
    "title": "filemanager",
    "link":"",
    "files": []
}


app.get("/", function (req, res) {
    FILES_DIRECTORY = __dirname + "\\files\\"
    context.files = getAllFiles()
    context.link =""
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
    const filepath = path.join(FILES_DIRECTORY, req.body.value)
    if (!fs.existsSync(filepath)) {
        fs.mkdir(filepath, (err) => {
            if (err) throw err
        })
        console.log("jest");
    }
    res.redirect(req.body.link)
})
app.post("/upload/txt", function (req, res) {
    const filepath = path.join(FILES_DIRECTORY, `${(req.body.value).trim()}.txt`)
    if (!fs.existsSync(filepath)) {
        fs.writeFile(filepath, `Nowy dokument tekstowy utworzony: ${new Date(Date.now()).toDateString()}`, (err) => {
            if (err) throw err
        })   
    }
    res.redirect(req.body.link)
})

app.get("/file/:id", function (req, res) {
    const id = req.params.id
    const filepath = path.join(FILES_DIRECTORY, id)
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

app.get("/*", function (req, res) {
    const route = req.params[0]
    if(route == "favicon.ico") return;
    const filepath = path.join(__dirname, "files",route)
    if(fs.existsSync(filepath))
    {
        const files = fs.readdirSync(filepath, 'utf8');
        const response = [];
        for (let file of files) {
            const extension = path.extname(file);
            const fileSizeInBytes = fs.statSync(filepath + '/' + file).size;
            response.push({ name: file, "type": extension, "size":fileSizeInBytes });
        }
        FILES_DIRECTORY = filepath
        context.files = [...response]
        context.link = "/" + route + "/"
        res.render('hero-page.hbs', context);   // nie podajemy ścieżki tylko nazwę pliku
        // res.redirect("/")

    }
    else{
        FILES_DIRECTORY = path.join(__dirname, "files")
        res.redirect("/")
    }
})

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
// app.get("*", function (req, res) {
//     res.redirect("/") 
// })

app.listen(PORT, function () {
    console.log("start serwera na porcie " + PORT)
})