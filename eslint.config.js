"use strict";

module.exports = [
	... require("@joepie91/eslint-config/react"),
	{
		languageOptions: {
			sourceType: "module",
		},
		rules: {
			indent: "off",
			semi: "off"
		}
	}
];
