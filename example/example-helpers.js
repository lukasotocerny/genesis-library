var customers = require("../data/both.js");

/* Item catalog */
var items = [
    { item_id: 4001, item_price: 210, item_name: 'Loafers', variant: 'Pyramid black', },
    { item_id: 4002, item_price: 210, item_name: 'Loafers', variant: 'Urban Camo' },
    { item_id: 4003, item_price: 220, item_name: 'Loafers', variant: 'Storm trooper' },
    { item_id: 4004, item_price: 210, item_name: 'Loafers', variant: 'Classic Leopard' },
    { item_id: 4011, item_price: 295, item_name: 'Chelsea Boots', variant: 'Navy' },
    { item_id: 4012, item_price: 295, item_name: 'Chelsea Boots', variant: 'Blake' },
    { item_id: 4013, item_price: 310, item_name: 'Chelsea Boots', variant: 'Jagger' },
    { item_id: 4014, item_price: 310, item_name: 'Chelsea Boots', variant: 'Brown Leather' },
];

/* === EVENT HELPERS === */

/* Void function that gets called before all others. Store as 'ignore' attribute of event */
function viewItem(session, customer) {
    var item = items[Math.floor(Math.random()*items.length)];
    session.last_item = item;
    return item;
}

/* Returns element for the item attribute in 'view_item' event */
function getLastItemId(session, customer) {
    return session.last_item.item_id;
}

/* Returns element for the item attribute in 'view_item' event */
function getLastItemPrice(session, customer) {
    return session.last_item.item_price;
}

/* Returns element for the item attribute in 'view_item' event */
function getLastItemName(session, customer) {
    return session.last_item.item_name;
}

/* Void function that gets called before all others. Store as 'ignore' attribute of event */
function addItem(session, customer) {
    var item = session.last_item;
    /* Add to added items */
    if (session.added_items) {
        session.added_items.push(item)
    } else {
        session.added_items = [item];
    }
}

/* Generates 'purchase_item' events */
function purchaseCart(session, customer, history) {
    let sum = 0;
    for (let i=0;i<session.added_items.length;i++) {
        history.push({
            name: "purchase_item",
            timestamp: history[history.length-1].timestamp + 1000*i,
            attributes: {
                item_id: session.added_items[i].item_id,
                item_price: session.added_items[i].item_price,
                item_name: session.added_items[i].item_name
            }
        });
        sum += session.added_items[i].item_price;
    }
    session.purchase_price = sum;
}

/* Get all added items */
function getPurchasePrice(session, customer) {
    return session.purchase_price;
}

/* === CUSTOMER HELPERS === */

/* Stores whole customer in 'ignore' attribute. Gets called with parameter i to allow iteration over catalog of customer */
function createCustomer(i) {
    var capitalize = (s) => {
        return s && s[0].toUpperCase() + s.slice(1);
    }
    const customer_raw = customers.results[i];
    var attributes = {
        first_name: capitalize(customer_raw.name.first),
        last_name: capitalize(customer_raw.name.last),
        email: customer_raw.email,
        phone: customer_raw.phone,
        city: customer_raw.location.city,
        gender: customer_raw.gender
    }
    return attributes;
};

function getRegistered() {
    return this.ignore.email;
};

function getCookie() {
    /*
     *  25% - 3 cookies
     *  50% - 2 cookies
     * 100% - 1 cookie
     */
    const roll = Math.random();
    if (this.registered === '') return uuidv4();
    if (roll < 0.25) return [uuidv4(), uuidv4(), uuidv4()];
    if (roll >= 0.25 && roll < 0.75) return [uuidv4(), uuidv4()];
    return uuidv4();
};

/* === ADHOC FUNCTIONS === */

/* https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript */
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

/* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

/* === EXPORT === */

module.exports = {
    event: {
        viewItem: viewItem,
        addItem: addItem,
        getLastItemId: getLastItemId,
        getLastItemName: getLastItemName,
        getLastItemPrice: getLastItemPrice,
        purchaseCart: purchaseCart,
        getPurchasePrice: getPurchasePrice
    },
    customer: {
        createCustomer: createCustomer,
        getRegistered: getRegistered,
        getCookie: getCookie,
        getFirstName() {
            return this.ignore.first_name;
        },        
        getLastName() {
            return this.ignore.last_name;
        },        
        getEmail() {
            return this.ignore.email;
        },        
        getPhone() {
            return this.ignore.phone
        },
        getAge() {
            var age = getRandomInt(36, 66);
            this.ignore.age = age;
            return age;
        },
        getGender() {
            return this.ignore.gender;
        }
    }
}