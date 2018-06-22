const Genesis = require("../src/library/Genesis.js");
const Event = Genesis.Event;
const Session = Genesis.Session;
const Generator = Genesis.Generator;
const SendManager = Genesis.SendManager;
const StoreManager = Genesis.StoreManager;
const helpers = require("./example-helpers.js");

const purchaseSession = new Session(
    "purchase_session",
    "session_start",
    "session_end",
    [
        new Event("session_start", { }),
        new Event("view_item_1", { name: "view_item", siblings: ["view_item_2"], ignore: helpers.event.viewItem, item_id: helpers.event.getLastItemId, item_name: helpers.event.getLastItemName, item_price: helpers.event.getLastItemPrice }),
        new Event("add_to_cart", { ignore: helpers.event.addItem, item_id: helpers.event.getLastItemId, item_name: helpers.event.getLastItemName, item_price: helpers.event.getLastItemPrice }),
        new Event("purchase", { ignore : helpers.event.purchaseCart, total_price: helpers.event.getPurchasePrice }),
        new Event("session_end", { })
	],
	[
        {from: "session_start", to: "view_item_1", probability: 1},
        {from: "view_item_1", to: "view_item_1", probability: 0.2},
        {from: "view_item_1", to: "view_item_2", probability: 0.3},
        {from: "view_item_1", to: "add_to_cart", probability: 0.3},
        {from: "view_item_2", to: "add_to_cart", probability: 0.5},
        {from: "add_to_cart", to: "purchase", probability: 0.5}
    ]
);

/* Bundles functions together */
var customerAttributes = {
    ignore: helpers.customer.createCustomer,
    registered: helpers.customer.getRegistered,
    cookie: helpers.customer.getCookie,
    first_name: helpers.customer.getFirstName,
    last_name: helpers.customer.getLastName,
    email: helpers.customer.getEmail,
    gender: helpers.customer.getGender,
    age: helpers.customer.getAge,
}

/* Parameters for data generation */
var options = {
    startTimestamp: 1485907200*1000, /* 1st February 2017 */
    endTimestamp: 1493596800*1000, /* 1st May 2017 */
    retention: [0.6, 0.3],
    totalCustomers: 1,
    sessionMean: 18, /* Center events around 6PM */
    postSessionsFunction: (() => console.log("post sesion"))
}
/* Creates the generator and generates data */
var generator = new Generator([ purchaseSession ], customerAttributes, options);
/* Exponea project_ids */
const projectIds = [ "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" ];
/* Execute script */
let customers = generator.createCustomers();
for (let i=0; i<customers.length; i++) {
    generator.createSessions(customers[i]);
}
generator.storeCommands(customers, projectIds, "./example-data.json").then(
    (res) => {
        if (res) {
            console.log("Storing commands finished.")
            /* If you want to send commands to Exponea API then uncomment following code */
            /* generator.sendCommands("./example-data.json").then((res) => console.log("Sending commands finished.")); */
        }
    }, (err) => {
        console.log(err)
    }
);
