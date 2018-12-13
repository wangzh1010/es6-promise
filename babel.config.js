module.exports = {
    "presets": ["@babel/preset-env"],
    "plugins": [
        ["@babel/plugin-transform-modules-umd", {
            "globals": { "es6-promise": "MyPromise" },
            "exactGlobals": true
        }]
    ]
}
