var Promise = require('../dist/es6-promise').default;
module.exports = {
    resolved: Promise.resolve,
    rejected: Promise.reject,
    deferred: function() {
        var obj = {};
        var prom = new Promise(function(resolve, reject) {
            obj.resolve = resolve;
            obj.reject = reject;
        });
        obj.promise = prom;
        return obj;
    }
};
