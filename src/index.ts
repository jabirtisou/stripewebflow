declare const STRIPE_KEY: string;

const init = async () => {
    let isIdealPayment = true;
    let isCardPayment = false;

    const stripe = window.Stripe?.(STRIPE_KEY);
    if (!stripe) return;

    const form = document.querySelector<HTMLFormElement>('[data-element="payment_form"]');
    if (!form) return;

    const ccStripeElement = document.querySelector<HTMLElement>('[data-element="cc_stripe"]');
    if (!ccStripeElement) return;

    const idealStripeElement = document.querySelector<HTMLElement>('[data-element="ideal_stripe"]');
    if (!idealStripeElement) return;

    const elements = stripe.elements();

    const idealBank = elements.create('idealBank', {});
    idealBank.mount(idealStripeElement);

    const card = elements.create('card');
    card.mount(ccStripeElement);

    // Get all tab elements
    var tabs = document.querySelectorAll('.w-tab-link');

    // Add click event listeners to each tab
    tabs.forEach(function(tab) {
    tab.addEventListener('click', function(event) {
        // Prevent the default link behavior
        event.preventDefault();

      // Get the data-element attribute value
        var dataElement = tab.getAttribute('data-element');

        // Check if the clicked tab has a specific data-element value
        if (dataElement === 'ideal_button') {
            isIdealPayment = true;
            isCardPayment = false;
        } else if (dataElement === 'card_button') {
            isCardPayment = true;
            isIdealPayment = false;
        }
      });
    });


    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const amountStripeElement = document.querySelector<HTMLInputElement>('[data-element="price_amount"]');
        let amountNumber = parseFloat(String(amountStripeElement?.value)) ?? 0;
        
        if (!amountStripeElement || isNaN(amountNumber)) {
            return;
        }

        // amountNumber * 100 because stripe does the input price / 100
        let correctStripeAmount = amountNumber * 100;
        const payment_intent = await createPaymentIntent(correctStripeAmount);
        if (!payment_intent) return;

        await elements.submit()

        if(isIdealPayment){
            const resultIdealPayment = await stripe.confirmIdealPayment(payment_intent.clientSecret ,{
                payment_method: {
                    ideal: idealBank
                },
                return_url: 'https://stripe-donate.webflow.io/thank-you',
                // receipt_email: 'email of customer'
            })
        } else if(isCardPayment){
            const resultCardPayment = await stripe.confirmCardPayment(payment_intent.clientSecret, {
            payment_method: {
                    card: card
                },
                return_url: 'https://stripe-donate.webflow.io/thank-you',
                // receipt_email: 'email of customer'
            })
            if(resultCardPayment.error) window.location.replace(`https://stripe-donate.webflow.io/thank-you?redirect_status=${resultCardPayment.error?.message}`);
            else window.location.replace(`https://stripe-donate.webflow.io/thank-you?redirect_status=${resultCardPayment.paymentIntent.status}`);
        }
    })
};

const createPaymentIntent = async (amount: number) => {
    try {
        const response = await fetch('https://cloudflare-work.jabirtisou8072.workers.dev/create-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: amount,
                currency: 'eur'
            })
        });
        const data: { paymentIntent_id:string; clientSecret: string } = await response.json();

        return data;
    }catch(err) {
        return null;
    }
}

init();