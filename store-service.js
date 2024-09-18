const fs = require('fs');
const path = require('path');

let items = [];
// let categories = [
//     { id: 1, name: 'Home, Garden' },
//     { id: 2, name: 'Electronics, Computers, Video Games' },
//     { id: 3, name: 'Clothing' },
//     { id: 4, name: 'Sports & Outdoors' },
//     { id: 5, name: 'Pets' }
// ];



module.exports.initialize = function() {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, 'data/items.json'), 'utf8', (err, data) => {
            if (err) {
                reject("Unable to read file items.json");
                return;
            }
            items = JSON.parse(data);

            fs.readFile(path.join(__dirname, 'data/categories.json'), 'utf8', (err, data) => {
                if (err) {
                    reject("Unable to read file categories.json");
                    return;
                }
                categories = JSON.parse(data);
                resolve();
            });
        });
    });
};

module.exports.getAllItems = function() {
    return new Promise((resolve, reject) => {
        if (items.length === 0) {
            reject("No results returned");
        } else {
            resolve(items);
        }
    });
};

module.exports.getPublishedItems = function() {
    return new Promise((resolve, reject) => {
        const publishedItems = items.filter(item => item.published);
        if (publishedItems.length === 0) {
            reject("No results returned");
        } else {
            resolve(publishedItems);
        }
    });
};

let categories = [
    { id: 1, name: 'Home, Garden' },
    { id: 2, name: 'Electronics, Computers, Video Games' },
    { id: 3, name: 'Clothing' },
    { id: 4, name: 'Sports & Outdoors' },
    { id: 5, name: 'Pets' }
];

module.exports.getCategories = () => {
    return new Promise((resolve, reject) => {
        if (categories.length > 0) {
            resolve(categories);
        } else {    
            reject("No categories found");
        }
    });
};

function addItem(itemData) {
    return new Promise((resolve, reject) => {
        if (itemData.published === undefined) {
            itemData.published = false;
        } else {
            itemData.published = true;
        }

        itemData.id = items.length + 1;
        items.push(itemData);
        resolve(itemData);
    });
}

module.exports.addItem = addItem;

function getItemsByCategory(category) {
    return new Promise((resolve, reject) => {
        let filteredItems = items.filter(item => item.category == category);
        if (filteredItems.length > 0) {
            resolve(filteredItems);
        } else {
            reject("no results returned");
        }
    });
}

module.exports.getItemsByCategory = getItemsByCategory;

function getItemsByMinDate(minDateStr) {
    return new Promise((resolve, reject) => {
        let filteredItems = items.filter(item => new Date(item.postDate) >= new Date(minDateStr));
        if (filteredItems.length > 0) {
            resolve(filteredItems);
        } else {
            reject("no results returned");
        }
    });
}

module.exports.getItemsByMinDate = getItemsByMinDate;

function getItemById(id) {
    return new Promise((resolve, reject) => {
        let item = items.find(item => item.id == id);
        if (item) {
            resolve(item);
        } else {
            reject("no result returned");
        }
    });
}

module.exports.getItemById = getItemById;

module.exports.getPublishedItemsByCategory = (category) => {
    return new Promise((resolve, reject) => {
        const filteredItems = items.filter(item => item.published === true && item.category == category);
        if (filteredItems.length > 0) {
            resolve(filteredItems);
        } else {
            reject("No items found for this category");
        }
    });
};