async function register() {
    const reg = await navigator.serviceWorker.register('/entry.worker.js', {
            scope: "/",
        type: 'classic',
        updateViaCache: 'none',
    })

    // @ts-ignore
    window.$ServiceWorkerHMRHandler$ = async () => {
            await reg.update();
    }
}

if ('serviceWorker'in navigator) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        register();
    } else {
        window.addEventListener('load', register);
    }
}