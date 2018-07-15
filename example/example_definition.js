module.exports = {
	"settings": {
		"startTimestamp": 1514764800, // Required. Start time for generation.
		"endTimestamp": 1530403200, // Requied. End time for generation.
		"retention": [], // Required. Probability of customer having another session.
		"sessionMean": 12, // Optional, defaults to 12. Mean around which events will be normally distributed throughout the day.
		"sessionStd": 300000, // Optional, defaults to 1000*60*60*24/4. Standard deviation for events generation.
		"nextSessionDaysMin": 5, // Optional, defaults to 3. Minimal number of days after which another session is created.
		"nextSessionDaysMax": 7, // Optional, defaults to 10. Maximal number of days after which another session is created.
		"eventsSeparationTime": 100000, // Optional, defaults to 30000. Maximal number of milliseconds between two events.
	},
	"flows": [
		{
			"name": "purchaseFlow", // Optional, default to "Unnamed flow". Name of the Flow.
			"startNode": "4", // Required. ID of the starting Node.
			"exitNode": "3", // Required. ID of the ending Node.
			"nodes": [ // Optional defaults to [].
				{
					"id": "1", // Required.
					"type": "action", // Required. Has to be either action, customer_update, condition or event.
					"attributes": { // Required.
						"definition": "session.id = 42; session.cart = [{id: 1},{id: 2},{id: 3}];" // Required. JavaScript code to execute.
					}
				},
				{
					"id": "2",
					"type": "condition",
					"attributes": { // Required.
						"definition": "{{ session.id == 42 }}" // Required. JavaScript/Jinja code returning boolean.
					}
				},
				{
					"id": "3", // Required.
					"type": "event", // Required.
					"attributes": { // Required.
						"resourcesDefinitions": {
							"last_view_item": "{{ LAST('view_item') }}"
						},
						"name": "blank_event" // Optional, defaults to id.
					}
				},
				{
					"id": "4", // Required.
					"type": "event", // Required.
					"attributes": { // Required.
						"name": "view_item", // Optional, defaults to id.
						"resourcesDefinitions": { // Optional, defaults to {}.
							"item": "{{ RANDOM(catalog) }}"
						},
						"attributesDefinitions": { // Optional, defaults to {}.
							"item_id": "{% if false %} 'x' {% else %} 'y' {% endif %}"
						},
						"pageVisit": { // Optional, defaults to { enabled: false }.
							"enabled": false,
							"attributesDefinitions": {
								"url": "shop.com/product?id={{ resources.sale_name }}",
								"referrer": "{{ customer.name }}",
								"browser": "{{ session.browser ",
								"device": "{{ session.device }}",
								"os": "{{ session.os }}"
							}
						},
						"repetition": { // Optional, defaults to { enabled: false }.
							"type": "iterative",
							"enabled": false,
							"attributes": {
								"iteratorDefinition": "{{ session.cart | safe }}"
							}
						}
					}
				}
			],
			"transitions": [ // Optional, defaults to [].
				{ "source": "4", "destination": "3", "probability": 1 }
			]
		}
	],
	"customers": [ // Optional, defaults to [].
		{ "ids": { "registered": "x" }, "attributes": { "name": "Lukas", "surname": "Cerny" } }
	],
	"catalog": [ // Optional, defaults to [].
		{ "item_id": "1", "item_name": "Socks" },
		{ "item_id": "2", "item_name": "Jeans" }
	]
};
