function createPhonepePaymentRequest(data, payable_amount){
    if (!window.PaymentRequest) return null;

    var paymentRequestPhonepe = new PaymentRequest([{
        supportedMethods: ["https://mercury-stg.phonepe.com/transact/checkout"],
        data: data
    }], {total: {label: 'Cart Amount', amount: {currency: 'INR', value: payable_amount}}});
    return paymentRequestPhonepe;
}

function openPhonepeExpressbuy(ppeUrl, handleResponse, handleError) {
    var data = {
        url: ppeUrl,
    };
    var paymentRequestPhonepe = createPhonepePaymentRequest(data, 1);
    if(paymentRequestPhonepe == null) return;
    paymentRequestPhonepe.show().then(handlePaymentResponse).catch(handleError);
}

async function getExpressbuyResults(paymentRequestContext){
    if(sessionStorage.getItem('eligibilityForExpressbuy') == null || sessionStorage.getItem('eligibilityForExpressbuy') == 'false')
        await warmupAndSaveResults(paymentRequestContext);
    return {
        'userOperatingSystem': sessionStorage.getItem('userOperatingSystem'),
        'network': sessionStorage.getItem('network'),
        'eligibility': sessionStorage.getItem('eligibilityForExpressbuy'),
        'canMakePayment': sessionStorage.getItem('canMakePayment'),
        'hasEnrolledInstrument': sessionStorage.getItem('hasEnrolledInstrument'),
        'retries': sessionStorage.getItem('hasEnrolledInstrumentRetries'),
        'elapsedTime': sessionStorage.getItem('elapsedTime'),
        'paymentRequestSupported': sessionStorage.getItem('paymentRequestSupported')
    };
}

async function warmupAndSaveResults(paymentRequestContext) {
    console.log(navigator.userAgent);
    var userOperatingSystem = navigator.userAgent.split(';')[1].trim();
    var network = navigator.connection.effectiveType;
    var isAndroid = false;
    var paymentRequestSupported = false;
    var canMakePayment = false;
    var hasEnrolledInstrument = false;
    var retries = sessionStorage.getItem('hasEnrolledInstrumentRetries') ?? 0;
    if(userOperatingSystem.includes("Android"))
        isAndroid = true;
    var elapsedTime = -1;
    console.log(userOperatingSystem);
    console.log(isAndroid);

    var data = {
        url: "ppe://expressbuy",
        constraints : paymentRequestContext?.constraints ?? []
    }
    var paymentRequestPhonepe = createPhonepePaymentRequest(data, 1);
    if(isAndroid && paymentRequestPhonepe != null)
    {
        paymentRequestSupported = true;
        canMakePayment = await paymentRequestPhonepe.canMakePayment();
        var startTime = performance.now();
        var pageRetryLimit = 3;
        while(canMakePayment == true && retries < 9 && hasEnrolledInstrument == false && pageRetryLimit > 0)
        {
            hasEnrolledInstrument = await paymentRequestPhonepe.hasEnrolledInstrument()
            if(hasEnrolledInstrument) break;
            paymentRequestPhonepe = createPhonepePaymentRequest(data, 1);
            retries++;
            pageRetryLimit--;
        }
        var endTime = performance.now();
        elapsedTime = endTime - startTime;
    }
    sessionStorage.setItem('hasEnrolledInstrumentRetries', retries);
    sessionStorage.setItem('eligibilityForExpressbuy', hasEnrolledInstrument);
    sessionStorage.setItem('userOperatingSystem', userOperatingSystem);
    sessionStorage.setItem('paymentRequestSupported', paymentRequestSupported);
    sessionStorage.setItem('hasEnrolledInstrument', hasEnrolledInstrument);
    sessionStorage.setItem('elapsedTime', elapsedTime);
    sessionStorage.setItem('canMakePayment', canMakePayment);
    sessionStorage.setItem('network', network);
}
