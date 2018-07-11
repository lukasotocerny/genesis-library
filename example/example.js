const Genesis = require("../dist/index.js");
const definition = require("./example_definition.js");
const Generator = Genesis.Generator;

/* Creates the generator and generates data */
const generator = new Generator(definition);
const customers = generator.createCustomers();
generator.createSessions(customers[0]);
customers[0].printHistory();
console.log(customers[0].attributes)