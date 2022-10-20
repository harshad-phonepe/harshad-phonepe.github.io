function createPhonepePaymentRequest(data, payableAmount){
    if (!window.PaymentRequest) return null;

    var paymentRequestPhonepe = new PaymentRequest([{
        supportedMethods: ["https://mercury.phonepe.com/transact/checkout"],
        data: data
    }], {total: {label: 'Cart Amount', amount: {currency: 'INR', value: payableAmount}}});
    return paymentRequestPhonepe;
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
    var network = navigator?.connection?.effectiveType ?? null;
    var isAndroid = false;
    var paymentRequestSupported = false;
    var canMakePayment = false;
    var hasEnrolledInstrument = false;
    var retries = sessionStorage?.getItem('hasEnrolledInstrumentRetries') ?? 0;
    var elapsedTime = -1;
    var data = {
        url: "ppe://expressbuy",
        constraints : paymentRequestContext?.constraints ?? []
    };
    var paymentRequestPhonepe = createPhonepePaymentRequest(data, 1);
    var userOperatingSystem = navigator?.userAgent?.split(';')[1]?.trim() ?? null;

    if(userOperatingSystem?.includes("Android") ?? false)
        isAndroid = true;
    console.log(userOperatingSystem);
    console.log("isAndroid: ", isAndroid);

    if(isAndroid && paymentRequestPhonepe != null){
        paymentRequestSupported = true;
        canMakePayment = await paymentRequestPhonepe?.canMakePayment() ?? false;
        var startTime = performance?.now() ?? 0;
        var pageRetryLimit = 3;
        while(canMakePayment == true && retries < 9 && hasEnrolledInstrument == false && pageRetryLimit > 0){
            hasEnrolledInstrument = await paymentRequestPhonepe?.hasEnrolledInstrument() ?? false;
            if(hasEnrolledInstrument) 
                break;
            paymentRequestPhonepe = createPhonepePaymentRequest(data, 1);
            retries++;
            pageRetryLimit--;
        }
        var endTime = performance?.now() ?? 0;
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