module.exports = {
	"settings": {
		"startTimestamp": 1514764800,
		"endTimestamp": 1530403200,
		"retention": [0.6, 0.3, 0.3],
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
					"id": "1",
					"type": "action",
					"attributes": {
						"definition": "session.id = 42; session.cart = [{id: 1},{id: 2},{id: 3}];"
					}
				},
				{
					"id": "2",
					"type": "condition",
					"attributes": {
						"definition": "{{ session.id == 42 }}"
					}
				},
				{
					"id": "3",
					"type": "customer_update",
					"attributes": {
						"attributesDefinitions": {
							"session_id": "{{ session.id }}",
							"name": "{{ customer.attributes.name }}"
						},
						"idsDefinitions": {
							"registered": "{{ customer.attributes.email }}"
						}
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
							"item_id": "{{ resources.sale_name }}"
						},
						"pageVisit": {
							"enabled": true,
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
				{
					"source": "1",
					"destination": "2",
					"probability": 0.5,
					"sourceOption": "true"
				}
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
