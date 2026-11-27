import assert from "node:assert/strict";
import test from "node:test";
import { registrationWelcome } from "./welcome-email";

test("the registration welcome uses Kayla's copy for every lead type", () => {
  const buyer = registrationWelcome({
    name: "QA Local",
    email: "qa-local@example.com",
    intent: "buyer",
  });
  const seller = registrationWelcome({
    name: "QA Local",
    email: "qa-local@example.com",
    intent: "seller",
  });
  assert.equal(buyer.subject, "Welcome, QA, your Vancouver home search is ready");
  assert.equal(seller.subject, buyer.subject);
  assert.equal(seller.text.split("Browse homes:")[0], buyer.text.split("Browse homes:")[0]);
  assert.match(buyer.text, /Thanks for connecting with us!/);
  assert.match(buyer.text, /Create a Custom Search/);
  assert.match(buyer.text, /Happy house hunting!/);
  assert.match(buyer.text, /Talk soon/);
  assert.match(buyer.text, /Casey Archibald \| Vancouver Real Estate/);
  assert.match(buyer.text, /REMAX Crest Realty Westside/);
  assert.match(buyer.html, /tel:6043637858/);
  assert.match(buyer.html, /https:\/\/www\.caseyarchibald\.com/);
  assert.doesNotMatch(buyer.text + buyer.html, /Archibald Real Estate Group team/);
  assert.match(buyer.html, /Browse homes/);
  assert.match(buyer.html, /\/search/);
  assert.match(buyer.html, /\/saved/);
  assert.match(buyer.html, /\/compare/);
  assert.match(buyer.html, /\/notebook/);
  assert.match(buyer.html, /\/contact/);
  assert.match(buyer.html, /Archibald Real Estate Group/);
  assert.match(buyer.html, /RE\/MAX Crest Realty/);
  assert.doesNotMatch(buyer.text + buyer.html, /password/i);
  assert.doesNotMatch(buyer.text + buyer.html, /opt in|consent you gave|sSearch/i);
  assert.doesNotMatch(buyer.text + buyer.html, /testimonial|ranked|top 1%/i);
  assert.doesNotMatch(buyer.text, /set up as a seller|set up as a buyer/);
  assert.doesNotMatch(buyer.html, /#e11b22|Georgia|Times New Roman|&#10084;|&#128197;|&#8981;/i);
  assert.doesNotMatch(buyer.html, /\/_next\/image/);
  assert.doesNotMatch(buyer.text, /[\u{1F300}-\u{1FAFF}]/u);
});

test("welcome listing cards never use Unsplash placeholders", () => {
  const message = registrationWelcome(
    { name: "Alex Morgan", email: "preview@example.com" },
    [{
      address: "Sample St",
      city: "Vancouver",
      price: 1000000,
      href: "/homedetails/bc/vancouver/1/sample",
      image: "https://images.unsplash.com/photo-1.jpg",
    }],
  );
  assert.doesNotMatch(message.html, /unsplash/i);
  assert.doesNotMatch(message.text, /Sample St/);
});
