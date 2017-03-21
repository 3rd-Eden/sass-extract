const { expect } = require('chai');
const path = require('path');
const { render, renderSync } = require('../lib');

const fn = path.join(__dirname, 'sass', 'function.scss');

function verifyResult(rendered) {
  expect(rendered.vars).to.exist;
  expect(rendered.vars).to.have.property('global');
  expect(rendered.vars.global).to.have.property('$nounit');
  expect(rendered.vars.global.$nounit.value).equals(10);
  expect(rendered.vars.global.$nounit.unit).equals('');
}

describe('sass functions', () => {
  describe('sync', () => {
    it('executes sass functions and returns their result', function () {
      const rendered = renderSync({ file: fn });

      verifyResult(rendered);
    });
  });
});
