const express = require("express");
const app = express()
const PORT = 3000;
const path = require("path")
const hbs = require('express-handlebars');
const fs = require('fs');
const formidable = require('formidable');
let FILES_DIRECTORY = __dirname + "\\files\\"

// po cofnięciu strzałkami w window nie zmienia sie FILEPATH


app.set('views', path.join(__dirname, 'views'));
app.engine('hbs', hbs({
    defaultLayout: 'main.hbs',
    helpers: {
        json:  (obj) => {return JSON.stringify(obj)},
        img: (name) =>{
            let icons = getAllIcons()
            const lastIndex = name.lastIndexOf(".")
            const filepath = path.join(FILES_DIRECTORY,name)
            if(!fs.existsSync(filepath))
            {
                return;
            }
            else if(fs.lstatSync(filepath).isDirectory())
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
            if(!fs.existsSync(filepath))
            {
                return;
            }
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
    "files": [],
    "fileTypes": `".txt",".css",".py",".html",".docx",".xml",".json",".csv",".cpp",".h",".c",".cs",".java",".hbs",".js",".jsx",".php"`
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
    form.uploadDir = FILES_DIRECTORY;
    form.multiples = true;
    form.keepFilenames = true;  
    form.keepExtensions = true;
    form.on ('fileBegin', function(name, file){
        file.path = path.join(FILES_DIRECTORY ,(file.name).trim());        
        while(fs.existsSync(file.path))
        {
            const lastIndex = (file.path).lastIndexOf(".")
            file.path = (file.path).slice(0, lastIndex).trim() + "_kopia" + (file.path).slice(lastIndex) 
        }
    })

    form.parse(req,function (err, fields, files) {
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
    let link = FILES_DIRECTORY.replace(path.join(__dirname, "files"),"")

    setTimeout(()=>res.redirect(link.replaceAll("\\","/")))
     
});

app.post("/upload/dir", function (req, res) {
    console.log(path.join(FILES_DIRECTORY, req.body.value))
    const filepath = path.join(FILES_DIRECTORY, req.body.value)
    
    if (!fs.existsSync(filepath)) {
        fs.mkdir(filepath, (err) => {
            if (err) throw err
        })
        console.log("jest");
    }
    // dodaj tutaj obsłużenie wyjatku jeśli plik istnieje
    res.redirect((req.body.link).replaceAll("\\","/"))
})
app.post("/upload/txt", function (req, res) {
    const lastIndex = req.body.value.lastIndexOf(".")
    const predefindedExtensions = [".txt",".css",".py",".html",".docx",".xml",".json",".csv",".cpp",".h",".c",".cs",".java",".hbs",".js",".jsx",".php"]
    let filepath = ""
    if(predefindedExtensions.includes(req.body.value.slice(lastIndex))) filepath = path.join(FILES_DIRECTORY, (req.body.value).trim())
    else filepath = path.join(FILES_DIRECTORY, `${(req.body.value).trim()}.txt`)
    console.log(filepath)

    if (!fs.existsSync(filepath)) {
        fs.writeFile(filepath, `${new Date(Date.now())}`, (err) => {
            if (err) throw err
        })   
    }
    // dodaj tutaj obsłużenie wyjatku jeśli plik istnieje
    res.redirect((req.body.link).replaceAll("\\","/"))
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