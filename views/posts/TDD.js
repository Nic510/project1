var assert = require("chai").assert;
var http   = require("http");
var server = require("../app.js");

it("should return a 200 response", function (done) {

    var app = server();

    http.get("http://localhost:4000", function (res) {
        assert.equal(res.statusCode, 200);
        done();
    });
});