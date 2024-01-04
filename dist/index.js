"use strict";
(() => {
  // bin/live-reload.js
  //new EventSource(`${"http://localhost:3000"}/esbuild`).addEventListener("change", () => location.reload());

  // src/index.ts
  var init = async () => {
    let isIdealPayment = true;
    let isCardPayment = false;
    const stripe = window.Stripe?.("pk_test_51OJjQxA8yQevovoJTjCBQdN1tLAHzrQ82wfGZymhr0fHRF0KH5U4ljIRcs9ZZMipzP7Bqabz7gEnj2g9IbfWcWeF0009IpfcQY");
    if (!stripe)
      return;
    const form = document.querySelector('[data-element="payment_form"]');
    if (!form)
      return;
    const ccStripeElement = document.querySelector('[data-element="cc_stripe"]');
    if (!ccStripeElement)
      return;
    const idealStripeElement = document.querySelector('[data-element="ideal_stripe"]');
    if (!idealStripeElement)
      return;
    const appearance = {
      theme: 'stripe'
    };
    const elements = stripe.elements({clientSecret, appearance});
    const idealBank = elements.create('idealBank');
    idealBank.mount(idealStripeElement);
    const card = elements.create('card');
    card.mount(ccStripeElement);
    var tabs = document.querySelectorAll(".w-tab-link");
    tabs.forEach(function(tab) {
      tab.addEventListener("click", function(event) {
        event.preventDefault();
        var dataElement = tab.getAttribute("data-element");
        if (dataElement === "ideal_button") {
          isIdealPayment = true;
          isCardPayment = false;
        } else if (dataElement === "card_button") {
          isCardPayment = true;
          isIdealPayment = false;
        }
      });
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const amountStripeElement = document.querySelector('[data-element="price_amount"]');
      let amountNumber = parseFloat(String(amountStripeElement?.value)) ?? 0;
      if (!amountStripeElement || isNaN(amountNumber)) {
        return;
      }
      let correctStripeAmount = amountNumber * 100;
      const payment_intent = await createPaymentIntent(correctStripeAmount);
      if (!payment_intent)
        return;
      await elements.submit();
      if (isIdealPayment) {
        const resultIdealPayment = await stripe.confirmIdealPayment(payment_intent.clientSecret, {
          payment_method: {
            ideal: idealBank
          },
          return_url: "https://stripe-donate.webflow.io/thank-you"
          // receipt_email: 'email of customer'
        });
      } else if (isCardPayment) {
        const resultCardPayment = await stripe.confirmCardPayment(payment_intent.clientSecret, {
          payment_method: {
            card
          },
          return_url: "https://stripe-donate.webflow.io/thank-you"
          // receipt_email: 'email of customer'
        });
        if (resultCardPayment.error)
          window.location.replace(`https://stripe-donate.webflow.io/thank-you?redirect_status=${resultCardPayment.error?.message}`);
        else
          window.location.replace(`https://stripe-donate.webflow.io/thank-you?redirect_status=${resultCardPayment.paymentIntent.status}`);
      }
    });
  };
  var createPaymentIntent = async (amount) => {
    try {
      const response = await fetch("https://cloudflare-work.jabirtisou8072.workers.dev/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount,
          currency: "eur"
        })
      });
      const data = await response.json();
      return data;
    } catch (err) {
      return null;
    }
  };
  init();
})();
//# sourceMappingURL=index.js.map
