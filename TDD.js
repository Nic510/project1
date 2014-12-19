var expect = require('chai').expect;
// Write a test for a method that takes a number and calculates its factorial value.
// Then write the method to make that test pass.
describe('#factorial()', function (){
it('returns the factorial value of a number', function (){
expect(factorial(4)).to.equal(24);
expect(factorial(5)).to.equal(120);
})
})