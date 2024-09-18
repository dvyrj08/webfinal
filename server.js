/*********************************************************************************

WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Divyraj Solanki 
Student ID: 149093213 
Date: 19 July 2024
Vercel Web App URL: https://web322-app-nine.vercel.app/about
GitHub Repository URL: https://github.com/dvyrj08/web322-app

********************************************************************************/ 


const express = require('express');
const exphbs = require('express-handlebars');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const path = require('path');
const storeService = require('./store-service');

const app = express();
const PORT = process.env.PORT || 8080;

// Cloudinary configuration
cloudinary.config({
    cloud_name: 'dzulmzqxn',
    api_key: '946272788226926',
    api_secret: 'vR3q-m8F2Jtr6shBkP6P-8-Nr5o',
    secure: true
});

// Multer upload setup without disk storage
const upload = multer(); // no { storage: storage } since we are not using disk storage

// Middleware to serve static files
app.use(express.static(__dirname + "/public/"));

// Middleware to set activeRoute and viewingCategory
app.use(function(req, res, next) {
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});



// Setup express-handlebars
const hbs = exphbs.create({
    extname: '.hbs',
    helpers: {
        navLink: function(url, options) {
            return '<li' + ((url == app.locals.activeRoute) ? ' class="active" ' : '') + '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function(lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        }
    }
});
 app.engine('.hbs', hbs.engine);
 app.set('view engine', '.hbs');





// Route for "/about"
app.get('/about', (req, res) => {
    res.render('about');
});

// Redirect "/" to "/about"
app.get('/', (req, res) => {
    res.redirect('/about');
});

// Route to get all published items
app.get("/shop", async (req, res) => {
    let viewData = {};

    try {
        let items = [];
        if (req.query.category) {
            items = await itemData.getPublishedItemsByCategory(req.query.category);
        } else {
            items = await itemData.getPublishedItems();
        }
        items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
        let item = items[0];
        viewData.items = items;
        viewData.item = item;
    } catch (err) {
        viewData.message = "no results";
    }

    try {
        let categories = await itemData.getCategories();
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results";
    }

    res.render("shop", { data: viewData });
});


// Route to get all items
app.get('/items', (req, res) => {
    if (req.query.category) {
        storeService.getItemsByCategory(req.query.category)
            .then(data => res.render('items', { items: data }))
            .catch(err => res.render('items', { message: "no results" }));
    } else {
        storeService.getAllItems()
            .then(data => res.render('items', { items: data }))
            .catch(err => res.render('items', { message: "no results" }));
    }
});

// Route to get the "Add Post" page
app.get('/items/add', (req, res) => {
    res.render('addItem');
});

// Route to handle adding items
app.post('/items/add', upload.single("featureImage"), (req, res) => {
    if (req.file) {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );

                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        async function upload(req) {
            let result = await streamUpload(req);
            console.log(result);
            return result;
        }

        upload(req).then((uploaded) => {
            processItem(uploaded.url);
        });
    } else {
        processItem("");
    }

    function processItem(imageUrl) {
        req.body.featureImage = imageUrl;

        // Process the req.body and add it as a new Item before redirecting to /items
        storeService.addItem(req.body).then(() => {
            res.redirect('/items');
        }).catch((err) => {
            res.status(500).send("Unable to add item");
        });
    }
});

// Route to get an item by id
app.get('/item/:id', (req, res) => {
    storeService.getItemById(req.params.id)
        .then(data => res.json(data))
        .catch(err => res.status(500).json({ message: err }));
});

// Route to get categories
app.get('/categories', (req, res) => {
    storeService.getCategories()
        .then(data => {
            console.log(data); // Log the data to verify its structure
            res.render('categories', { categories: data });
        })
        .catch(err => res.render('categories', { message: "no results" }));
});


// Handle 404 errors
app.use((req, res) => {
    res.status(404).send("Page Not Found");
});

// Initialize the store service and start the server
storeService.initialize()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Express http server listening on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.log(`Failed to start server: ${err}`);
    });
