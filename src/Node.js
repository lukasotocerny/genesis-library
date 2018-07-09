class Node {
    constructor(id, type, node) {
        this.id = id;
        this.type = type;
        if(type == "event"){
            this.event = node;
        } else if (type == "condition") {
            this.condition = node;
        } else if (type == "action") {
            this.action = node;
        } else if (type == "customer_update") {
            this.customer_update = node;
        }
    }

    isEqual(node) {
        if (typeof(node) == "string" || node instanceof String) {
            return this.id === node;
        } else if (node instanceof Node) {
            return this.id === node.id;
        }
        return false;
    }
}

module.exports = Node;