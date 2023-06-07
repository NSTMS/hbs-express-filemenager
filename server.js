const express = require("express");
const app = express()
const PORT = 3000;
const path = require("path")
const hbs = require('express-handlebars');
const fs = require('fs');
const formidable = require('formidable');
const DEFAULT_DIRECTORY = path.join(__dirname, "files")
let CURRENT_DIRECTORY = path.join(__dirname, "files")
let prevPath = ""
let nextPath = ""

const THEMES = [{
  fg:"#fcfcfc",
  bg:"#343a40"
}
, 
{
  fg:"#343a40",
  bg:"#fcfcfc"
},
{
  fg:"#fcfcfc",
  bg:"#c1121f"
}
,
{
  fg:"#ffb33a",
  bg:"#3a86ff"
}]

let FONT_SIZE = 16
let CURRENT_THEME = 0


const DEFAULT_FILE_CONTENT = {
  ".txt": `New txt file : ${new Date(Date.now())}`,
  ".css": `
    body:{
      margin:0;padding;0;box-sizing:border-box;
    }
  `,
  ".py": `print('hello world')`,
  ".html":`
  <!DOCTYPE html>
  <html lang="pl-PL">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
  </head>
  <body>
    <h2>HELLO WORLD</h2>
  </body>
  </html>
  `,
  ".docx": `New docx file : ${new Date(Date.now())}`,
  ".xml":`<?xml version="1.0" encoding="UTF-8"?>
  <root>
    <message>Hello, World!</message>
  </root>`,
  ".json":`{
    "message": "Hello, World!"
  }`,
  ".cpp":`
    #include <iostream>
    using namespace std;
    int main() {
        cout << "Hello World!";
        return 0;
    }
    `,
  ".hbs":{
    
  },
  ".js":`console.log("Hello world")`,
  ".jsx":
  `
  import React from 'react';

function HelloWorld() {
  return (
    <div>
      <h1>Hello, World!</h1>
    </div>
  );
}

export default HelloWorld;`,
}

// po cofnięciu strzałkami w window nie zmienia sie FILEPATH


app.set('views', path.join(__dirname, 'views'));
app.engine('hbs', hbs({
    defaultLayout: 'main.hbs',
    helpers: {
        json:  (obj) => {return JSON.stringify(obj)},
        img: (link,name) => {
            let icons = getAllIcons();
            const lastIndex = name.lastIndexOf(".");
            const filepath = path.join(DEFAULT_DIRECTORY, link, name);
            if (!fs.existsSync(filepath)) {
              return;
            } else if (fs.lstatSync(filepath).isDirectory()) {
              return "http://localhost:3000/gfx/icons/dir.png";
            } else if (icons.includes(name.slice(lastIndex).toLowerCase())) {
              return "http://localhost:3000/gfx/icons/" + name.slice(lastIndex + 1).toLowerCase() + ".png";
            } else {
              return "http://localhost:3000/gfx/icons/file.png";
            }
          },
        link: (link) => {
            let route = link.replaceAll("\\","/");
            route = route.replaceAll("//","/")
            if (route.endsWith("/")) route = route.slice(0, -1);
            CURRENT_DIRECTORY = path.join(DEFAULT_DIRECTORY, route)
            let res = "";
            let prev = "";
            for (c of route.split("/")) {
              if (c == "") res += `<a href="/home"> home</a> `;
              else {
                prev += "/" + c;
                if (prev.startsWith("/")) prev = prev.slice(1);
                res += `/ <a href="/home/${prev}">${c}</a> `;
              }
            }
            return res;
          }, 
          isDir: (link, name) => {
            const filepath = path.join(DEFAULT_DIRECTORY, link, name);
            if (!fs.existsSync(filepath)) {
              return false;
            }
            return fs.lstatSync(filepath).isDirectory();
          },
          homeDir: (link) =>{
            return (link == "")? false : true
          },
          makeLink : (link, name)=>{
            return (link[0] == "/")?link + name: "/" + link + name
          },
          editorsLink :(src,name) =>{
            let route = src.split("/")
            route.pop()
            route = route.join("/")
            if (route.endsWith("/")) route = route.slice(0, -1);
            CURRENT_DIRECTORY = path.join(DEFAULT_DIRECTORY, route)
            let res = "";
            let prev = "";
            for (c of route.split("/")) {
              if (c == "") res += `<a href="/home"> home</a> `;
              else {
                prev += "/" + c;
                if (prev.startsWith("/")) prev = prev.slice(1);
                res += `/ <a href="/home/${prev}">${c}</a> `;
              }
            }
            return res;
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
app.use(express.static('files'));
app.use(express.json());

let context = {
    "title": "filemanager",
    "link":"",
    "files": [],
    "fileTypes": `".txt",".css",".py",".html",".docx",".xml",".json",".csv",".cpp",".h",".c",".cs",".java",".hbs",".js",".jsx",".php"`
}

app.get("/", function (req, res) {
    res.redirect("/home")
})

app.get("/home", function (req, res) {
  context.files = getAllFiles("/")
  context.link =""
  getAllIcons()
  res.render('files-view.hbs', context); 
})
app.post('/upload', function (req, res) {
    let form = formidable.IncomingForm();
    form.uploadDir = CURRENT_DIRECTORY
    form.multiples = true;
    form.keepFilenames = true;  
    form.keepExtensions = true;
    form.on ('fileBegin', function(name, file){
        file.path = path.join(CURRENT_DIRECTORY ,(file.name).trim());        
        file.path = whilePathExist(file.path)
    })
    form.parse(req,function (err, fields, files) {});
    let link = CURRENT_DIRECTORY.replace(DEFAULT_DIRECTORY,"")
    res.redirect("/home/"+link.replaceAll("\\","/"))     
});



app.post("/upload/dir", function (req, res) {
    const filepath = path.join(DEFAULT_DIRECTORY, req.body.link, req.body.value)    
    if (!fs.existsSync(filepath)) {
        fs.mkdir(filepath, (err) => {
            if (err) throw err
        })
    }
    // dodaj tutaj obsłużenie wyjatku jeśli plik istnieje
    res.redirect("/home"+(req.body.link).replaceAll("\\","/"))
})
app.post("/upload/txt", function (req, res) {
    const lastIndex = req.body.value.lastIndexOf(".")
    const predefindedExtensions = [".txt",".css",".py",".html",".docx",".xml",".json",".csv",".cpp",".h",".c",".cs",".java",".hbs",".js",".jsx",".php"]
    let filepath = ""
    if(predefindedExtensions.includes(req.body.value.slice(lastIndex))) filepath = path.join(DEFAULT_DIRECTORY, req.body.link, (req.body.value).trim())
    else filepath = path.join(DEFAULT_DIRECTORY, req.body.link, `${(req.body.value).trim()}.txt`)
    let data = ""
    if(Object.keys(DEFAULT_FILE_CONTENT).includes(req.body.value.slice(lastIndex)))
    {
      data = DEFAULT_FILE_CONTENT[req.body.value.slice(lastIndex)]
    }
    filepath = whilePathExist(filepath)
    fs.writeFile(filepath, data, (err) => {
        if (err) throw err
    })   
    res.redirect("/home/"+ (req.body.link).replaceAll("\\","/"))
})

app.post("/file", function(req,res){
    let body = req.body
    let link = body.link
    let name = body.name
    const filepath = path.join(DEFAULT_DIRECTORY, link, name)
    const lastIndex = name.lastIndexOf(".")
    const imagesExtension = ['.png','.jpeg','.jpg','.webp']
    if(imagesExtension.includes(name.slice(lastIndex)))
    {
      res.render("image-view.hbs", {
        name : name,
        link : link, 
        src : (link + name).replaceAll("//","/")
      })
    }
    else{
      let data
      console.log(prevPath, nextPath, link+ name)
      if((link + name).replaceAll("/","") == prevPath.replaceAll("/","")) 
      {
        if(nextPath[0] == "/") nextPath = nextPath.slice(1);
        data =  fs.readFileSync(path.join(DEFAULT_DIRECTORY, nextPath))
        name = nextPath.slice(nextPath.lastIndexOf("/")+1)
      }
      else{
        data = fs.readFileSync(filepath, 'utf8');
      }      
      res.render("editor-view.hbs",{
        name : name,
        content: data,
        src : (link + name).replaceAll("//","/"),
        themes : THEMES
      })
    }
})
app.get('/getFilters', function(req, res){
  const filters = {
    "grayscale" : "grayscale(100%)",
    "contrast" : "contrast(300%)",
    "invert" : "invert(100%)",
    "sepia" : "sepia(80%)",
    "saturate" : "saturate(100%)",
    "hue" : " hue-rotate(180deg)",
    "none" : "none",
  }
  res.send(JSON.stringify(filters))
})
app.post("/saveImage",function(req,res){
  let form = formidable.IncomingForm();
  form.uploadDir = CURRENT_DIRECTORY
  form.keepExtensions = true;
  form.on ('fileBegin', function(name, file){
      file.path = path.join(CURRENT_DIRECTORY ,(file.name).trim());        
      // file.path = whilePathExist(file.path)
      console.log(file.path )
  })
  form.parse(req,function (err, fields, files) {});
  console.log('zapisano')
  // let data = req.body.dataUrl
  // console.log(data)
  // const base64 = fs.readFileSync(req.body.dataUrl, {encode: 'base64'})
  // fs.writeFileSync("path_to_our_image_file.jpeg", base64);
})


app.get("/sendCurrentFile", function (req, res) { 
  const filepath = path.join(CURRENT_DIRECTORY, req.query.name)
  if(fs.existsSync(filepath)) res.sendFile(filepath)
  else res.redirect("/home")
})
app.post('/saveFileChanges', function (req, res) {  
  let body = req.body
  const filepath = path.join(DEFAULT_DIRECTORY, body.src)
  fs.writeFileSync(filepath, body.content)
  //link src
  res.status(200)
})

app.post('/getEditorSettings', function (req, res) {  
  res.status(200).send(JSON.stringify({theme:CURRENT_THEME, fontSize: FONT_SIZE}));
})

app.post('/changeFontSize', function (req, res) {
  FONT_SIZE += req.body.value
  if(FONT_SIZE <=0 ) FONT_SIZE = 1
  res.status(200).send(JSON.stringify({fontSize: FONT_SIZE}))
})
app.post('/saveThemeChange', function (req, res) {
  CURRENT_THEME++
  if(CURRENT_THEME >= 4) CURRENT_THEME = 0
  res.status(200)
})

app.post("/saveEditorsSettings", function (req, res) {
  CURRENT_THEME = req.body.theme
  FONT_SIZE = req.body.fontSize
  res.status(200)
})

app.post("/remove", function (req, res) {
    let body = req.body
    const filepath = path.join(DEFAULT_DIRECTORY, body.link, body.name)
    if (fs.existsSync(filepath)) {
        if(fs.lstatSync(filepath).isDirectory())
        {
            fs.rm(filepath,{recursive: true, force: true}, (err)=>{
              if(err) return console.log("err",err);
            })    
        }
        else{
            fs.unlink(filepath,  (err) =>{})
        }
    }
    const link = body.link.slice(0, body.link.lastIndexOf("/"))

    res.redirect("/home"+link)
});

app.post("/changeFileName", function (req, res) {
  // value src
  let body = req.body;
  let temp = body.src
  temp = temp.replaceAll("//","/")
  temp = temp.slice(0,temp.lastIndexOf("/")) + "/" // '/nowy/'
  console.log(temp,body.src, body.value)
  let extension = ""
  let oldPath = ""
  let newPath = ""

  extension = body.src.slice(body.src.lastIndexOf("."))
  oldPath = path.join(DEFAULT_DIRECTORY, body.src);
  prevPath = body.src
  
  if(body.src.includes("/")) 
  {
    newPath = path.join(DEFAULT_DIRECTORY, temp, body.value + extension);
    nextPath = temp + body.value + extension
  }else 
  {
    newPath = path.join(DEFAULT_DIRECTORY, body.value + extension);
    nextPath = body.value + extension
  }

  fs.rename(oldPath, newPath,(err) => {
    const data = fs.readFileSync(newPath, 'utf8');
    console.log("redirect")
    // res.render("editor-view.hbs",{
    //   name : body.value + extension,
    //   content: data,
    //   src : (temp + body.value + extension),
    //   themes : THEMES
    // })
    res.redirect("/home"+temp+extension)
  })
});

app.post("/changeDirName", function (req, res) {
  let body = req.body;
  let temp = body.link.slice(0,-1)
  temp = temp.replaceAll("//","/")
  temp = temp.slice(0,temp.lastIndexOf("/")) + "/" // '/nowy/'
  const oldPath = path.join(DEFAULT_DIRECTORY, body.link);
  const newPath = whilePathExist(path.join(DEFAULT_DIRECTORY, temp, body.value));
  prevPath = body.link.replaceAll("//","/")
  nextPath = temp + body.value
  // console.log("old path: " + oldPath, "new path: " + newPath, "temp", temp)
  // console.log("prev:" + prevPath +  ", next:"+ nextPath, "redirected to: " +"/home" + temp + body.value )
  fs.rename(oldPath, newPath,(err) => {
    res.redirect("/home" + temp + body.value)
  })
});

app.get("/home/*", function (req, res) {
    let route = req.params[0]
    if(route == "favicon.ico") return;
    const filepath = path.join(DEFAULT_DIRECTORY,route)
    if(route[0] == "/") route = route.slice(1)

    if(fs.existsSync(filepath) || route.replaceAll("/","") == nextPath.replaceAll("/",""))
    {
        context.files =getAllFiles(route)
        context.link =  "/" + route + "/"
        res.render('files-view.hbs', context);   // nie podajemy ścieżki tylko nazwę pliku
    }
    else
    {
        if(route.replaceAll("/","") == prevPath.replaceAll("/","")) 
        {
          if(nextPath[0] == "/") nextPath = nextPath.slice(1);
          res.redirect("/home/" + nextPath)
        }
        else res.redirect("/home")
    }  
})


function getAllFiles(dir)
{
    const filepath = path.join(DEFAULT_DIRECTORY, dir)
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
function whilePathExist(filepath){
  while(fs.existsSync(filepath))
  {
      const lastIndex = (filepath).lastIndexOf(".")
      if(lastIndex == -1) filepath += "_kopia"
      else filepath = (filepath).slice(0, lastIndex).trim() + "_kopia" + (filepath).slice(lastIndex) 
  }
  return filepath
}
// app.get("*", function (req, res) {
//     res.redirect("/") 
// })

app.listen(PORT, function () {
    console.log("start serwera na porcie " + PORT)
})