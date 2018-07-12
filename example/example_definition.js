module.exports = {
	"settings": {
		"startTimestamp": 1514764800,
		"endTimestamp": 1530403200,
		"retention": [],
		"sessionMean": 12,
		"nextSessionDaysMin": 5,
		"nextSessionDaysMax": 20,
		"eventsSeparationTime": 3000
	},
	"flows": [
		{
			"name": "purchaseFlow",
			"startNode": "4",
			"exitNode": "2",
			"nodes": [
				{
					"id": "2",
					"type": "event",
					"attributes": {
						"name": "hello"
					}
				},
				{
					"id": "4",
					"type": "event",
					"attributes": {
						"name": "view_item",
						"resourcesDefinitions": {
							"catalog": "{{ catalog }}",
							"sale_name": "Black Friday Sale!",
							"discounts": "{ 'student': 50, child: 60, adult: 0 }"
						},
						"attributesDefinitions": {
							"item_id": "{{ resources.sale_name }}",
							"item_name": "{{ customer.name }}",
							"item_x": "{{ RANDOM(catalog) }}"
						},
						"pageVisit": {
							"enabled": false,
							"attributesDefinitions": {
								"url": "shop.com/product?id={{ resources.sale_name }}",
								"referrer": "{{ customer.name }}",
								"browser": "{{ session.browser ",
								"device": "{{ session.device }}",
								"os": "{{ session.os }}"
							}
						},
						"repetition": {
							"type": "iterative",
							"enabled": false,
							"attributes": {
								"iteratorDefinition": "{{ session.cart | safe }}"
							}
						}
					}
				}
			],
			"transitions": [
				{ "source": "4", "destination": "2", "probability": 1 }
			]
		}
	],
	"customers": [
		{ "ids": { "registered": "x" }, "attributes": { "name": "Lukas", "surname": "Cerny" } }
	],
	"catalog": [
		{ "item_id": "1", "item_name": "Socks" }
	]
};
