import assert from "node:assert/strict";
import test from "node:test";
import { emailLooksValid, suggestEmail } from "./email-suggest";

test("a comma before the domain ending is corrected", () => {
  assert.equal(suggestEmail("name@domain,com"), "name@domain.com");
  assert.equal(suggestEmail("name@domain,ca"), "name@domain.ca");
});

test("common domain misspellings are corrected", () => {
  assert.equal(suggestEmail("casey@gmial.com"), "casey@gmail.com");
  assert.equal(suggestEmail("casey@hotmial.com"), "casey@hotmail.com");
});

test("a normal email is left alone", () => {
  assert.equal(suggestEmail("name@domain.com"), null);
  assert.equal(emailLooksValid("name@domain.com"), true);
  assert.equal(emailLooksValid("name@domain,com"), false);
});
