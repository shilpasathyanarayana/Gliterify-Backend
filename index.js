// common for every node.js using mysql, express and cors
const mysql = require('mysql2');
const express = require('express');
const cors = require('cors');

var session = require('express-session');
const app = express();
app.use(express.json())
const port = 3001;
app.use(cors());
var cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(session({
    secret: '34SDgsdgspxxxxxxxdfsG', // just a long random string
    resave: false,
    saveUninitialized: true
}));

const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'KulfiSimba@143',
    database: 'gliterify'
}).promise();

// this is the function that will fetch the data from mysql and load all the catogory details
function getCategories() {
    return new Promise(function (resolve, reject) {
        var connection = mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: 'KulfiSimba@143',
            database: 'gliterify'
        });
        var query_str = "select category,images from categories";
        connection.query(query_str, function (err, rows, fields) {
            resolve(rows);
        });
    });
}


app.get('/categories', (req, res) => {
    console.log(req.sessionID);
    getCategories().then(
        function (categories) {
            console.log(categories);
            res.send(categories);
        }
    ).catch((err) => setImmediate(() => { throw err; }));
});
// --------------------------------------------------------------------------
function getCategory(category) {
    return new Promise(function (resolve, reject) {
        var connection = mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: 'KulfiSimba@143',
            database: 'gliterify'
        });
        var query_str = "select item_number,item_name,price,images from " + category;
        connection.query(query_str, function (err, rows, fields) {
            resolve(rows);
        });
    });
}

app.get('/categories/:category', (req, res) => {
    let mysqlResponse = null;
    console.log(req.params.category);
    getCategory(req.params.category).then(
        function (rows) {
            console.log(rows);
            res.send(rows);
        }
    ).catch((err) => setImmediate(() => { throw err; }));
});


// To get details of given item
function getDetails(category, item_number) {
    return new Promise(function (resolve, reject) {
        var connection = mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: 'KulfiSimba@143',
            database: 'gliterify'
        });

        var query_str = "select * from " + category + " " + "where item_number=?";
        var query_var = [item_number];
        connection.query(query_str, query_var, function (err, rows, fields) {
            resolve(rows);
        });
    });
}

app.get('/categories/:category/:item_number', (req, res) => {
    let mysqlResponse = null;
    console.log(req.params.category);
    getDetails(req.params.category, req.params.item_number).then(
        function (rows) {
            console.log(rows);
            res.send(rows);
        }
    ).catch((err) => setImmediate(() => { throw err; }));
});


// for add to cart features 

async function addToCart(item_number, count, price, order_id, category) {
    var query_str = "insert into cart(item_number,total_number,price,order_id,category) values(?,?,?,?,?)";
    var query_var = [item_number, count, price, order_id, category];
    const [rows] = await pool.query(query_str, query_var);
    return rows[0];
}


async function getStock(item_number, category) {
    console.log("getting stocks for item number: ", item_number, "category", category);
    let query_str = "select stock from " + category + " " + "where item_number=?"
    let query_var = [item_number]
    const [rows] = await pool.query(query_str, query_var);
    console.log("stock is", rows[0]);
    return rows[0];
}

async function getPrice(item_number, category) {
    var query_str = "select price from " + category + " " + "where item_number=?";
    var query_var = [item_number];
    const [rows] = await pool.query(query_str, query_var);
    console.log("price is ", rows[0]);
    return rows[0];
}

async function checkItemExistInCart(order_id, item_number) {
    var query_str = "select count(*) as count from cart where order_id=? and item_number=?";
    var query_var = [order_id, item_number];
    const [rows] = await pool.query(query_str, query_var);
    return rows[0];
}

async function updateCartCountAndPrice(count, price, item_number, order_id) {
    var query_str = "update cart set total_number= total_number + ? , price = price +? where item_number=? and order_id =?";
    var query_var = [count, price, item_number, order_id];
    const [rows] = await pool.query(query_str, query_var);
    console.log("Rows affected", rows);
    return rows[0];
}

async function calcTotalAmount(order_id) {
    var query_str = "select sum(price) as total from cart where order_id=?";
    var query_var = [order_id];
    const [rows] = await pool.query(query_str, query_var);
    return rows[0];
}

async function getAllCartItems(order_id) {
    var query_str = "select * from cart where order_id=?";
    var query_var = [order_id];
    const [rows] = await pool.query(query_str, query_var);
    console.log("items in the carts", rows);
    return rows;
}

async function placeOrder(order_id, totalAmount, date) {
    var query_str = "insert into orders(order_id,totalAmount,date) values(?,?,?)";
    var query_var = [order_id, totalAmount, date];
    const [rows] = await pool.query(query_str, query_var);
    console.log("place order", rows);
    return rows;
}

async function checkOrderExists(order_id) {
    var query_str = "select count(*) as count from orders where order_id =?";
    var query_var = [order_id];
    const [rows] = await pool.query(query_str, query_var);
    return rows[0];
}

async function updateCartForPlaceOrder(date, order_id) {
    var query_str = "update cart set date =? where order_id=?";
    var query_var = [date, order_id];
    const [rows] = await pool.query(query_str, query_var);
    return rows[0];

}

async function updateStockAfterOrderPlaced(category, item_number, count) {
    var query_str = "update " + category + " set stock = stock - ? where item_number = ?"
    var query_var = [count, item_number];
    const [rows] = await pool.query(query_str, query_var);
    return rows[0];
}

async function deleteCartItems(order_id) {
    var query_str = "delete from cart where order_id =?";
    var query_var = [order_id];
    const [rows] = await pool.query(query_str, query_var);
    return rows[0];
}

async function deleteCartItem(order_id, item_number) {
    var query_str = "delete from cart where order_id = ? and item_number =?";
    var query_var = [order_id, item_number];
    const [rows] = await pool.query(query_str, query_var);
    return rows[0];
}

async function addToCartUsingButton(item_number, order_id) {
    var query_str = "update cart set price = price + (price / total_number) ,total_number = total_number + 1  where item_number = ? and order_id =?"
    var query_var = [item_number, order_id];
    const [rows] = await pool.query(query_str, query_var);
    return rows[0];
}

async function removeFromCartUsingButton(item_number, order_id) {
    var query_str = "update cart set price = price - (price / total_number) ,total_number = total_number - 1  where item_number = ? and order_id =?"
    var query_var = [item_number, order_id];
    const [rows] = await pool.query(query_str, query_var);
    return rows[0];
}




app.post('/addToCart', async (req, res) => {
    console.log("item number is", req.body.item_number);
    console.log("quantity is", req.body.count);
    console.log("category is", req.body.category);
    console.log("order id is", req.body.order_id);
    const stock = await getStock(req.body.item_number, req.body.category);
    console.log("responding stock as", stock);
    if (req.body.count <= stock.stock) {
        const price = await getPrice(req.body.item_number, req.body.category);
        let sub_total = price.price * req.body.count;
        console.log("sub total is", sub_total);
        const count = await checkItemExistInCart(req.body.order_id, req.body.item_number);
        console.log("count outside is ", count);
        if (count.count > 0) {
            await updateCartCountAndPrice(req.body.count, sub_total, req.body.item_number, req.body.order_id);
            const totalAmount = await calcTotalAmount(req.body.order_id);
            console.log("total amount is ", totalAmount.total);
            const cartItems = await getAllCartItems(req.body.order_id);
            let cartDetails = {
                "items": cartItems,
                "total": totalAmount.total
            }
            res.send(cartDetails);
        }
        else {
            await addToCart(req.body.item_number, req.body.count, sub_total, req.body.order_id, req.body.category);
            const totalAmount = await calcTotalAmount(req.body.order_id);
            console.log("total amount is ", totalAmount.total);
            const cartItems = await getAllCartItems(req.body.order_id);
            let cartDetails = {
                "items": cartItems,
                "total": totalAmount.total
            }
            res.send(cartDetails);
        }
    } else {
        res.send("out of stock");
    }
});


app.post('/makeOrder', async (req, res) => {
    console.log("order id is", req.body.order_id);
    const totalAmount = await calcTotalAmount(req.body.order_id);
    console.log("total amount is ", totalAmount.total);
    const prevOrderId = await checkOrderExists(req.body.order_id);
    console.log("prev order id is", prevOrderId.count);
    if (prevOrderId.count == 0) {
        let date = new Date();
        console.log("date is", date);
        const order = await placeOrder(req.body.order_id, totalAmount.total, date);
        const cartItems = await getAllCartItems(req.body.order_id);
        for (let i = 0; i < cartItems.length; i++) {
            updateStockAfterOrderPlaced(cartItems[i].category, cartItems[i].item_number, cartItems[i].total_number);
        }
        await updateCartForPlaceOrder(date, req.body.order_id);
        console.log(order);
        res.send("Order submitted");
    }
    else {
        res.send("order already placed");
    }
})



app.get('/retreiveOrder/order_id/:order_id', async (req, res) => {
    console.log("order_id is", req.params.order_id);
    const totalAmount = await calcTotalAmount(req.params.order_id);
    console.log("total amount is ", totalAmount);
    const cartItems = await getAllCartItems(req.params.order_id);
    let cartDetails = {
        "items": cartItems,
        "total": totalAmount.total,
        "date": cartItems[0].date
    }
    res.send(cartDetails);
});


app.get('/cartItems/order_id/:order_id', async (req, res) => {
    console.log("order_id is", req.params.order_id);
    const totalAmount = await calcTotalAmount(req.params.order_id);
    console.log("total amount is ", totalAmount);
    const cartItems = await getAllCartItems(req.params.order_id);
    let cartDetails = {
        "items": cartItems,
        "total": totalAmount.total
    }
    res.send(cartDetails);
});


app.delete('/cartItems/order_id/:order_id', async (req, res) => {
    await deleteCartItems(req.params.order_id);
    res.status(200).send("all ok");
});


app.post('/addOrRemove', async (req, res) => {
    console.log("this is add or remove api");
    console.log(req.body.item_number);
    console.log(req.body.order_id);
    if (req.body.addOrSub == "add") {
        let updatedCountValue = await addToCartUsingButton(req.body.item_number, req.body.order_id);
        console.log("updated count is ", updatedCountValue);
    } else {
        if (req.body.count == 1) {
            await deleteCartItem(req.body.order_id, req.body.item_number);
        } else {
            let decreasedCountValue = await removeFromCartUsingButton(req.body.item_number, req.body.order_id);
            console.log("decreased count is", decreasedCountValue);
        }
    }

    const totalAmount = await calcTotalAmount(req.body.order_id);
    console.log("total amount is ", totalAmount);
    res.status(200).send("all ok");
})


app.listen(port, () => {
    console.log(`Gliterify api listening on port ${port}`)
});