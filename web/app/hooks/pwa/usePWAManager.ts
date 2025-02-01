import { useEffect, useState } from 'react';

type SWRegistration = ServiceWorkerRegistration | null;
type InstallPromptEvent = Event & { prompt: () => void; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
type UserChoice = 'accepted' | 'dismissed' | null;

export const usePWAManager = () => {
    const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
    const [swUpdate, setSwUpdate] = useState<{ isUpdateAvailable: boolean; newWorker: ServiceWorker | null }>({
        isUpdateAvailable: false,
        newWorker: null,
    });
    const [installPromptEvent, setInstallPromptEvent] = useState<InstallPromptEvent | null>(null);
    const [registration, setRegistration] = useState<SWRegistration>(null);
    const [userChoice, setUserChoice] = useState<UserChoice>(null);

    const promptInstall = async (cb: () => void = () => {}) => {
        if (installPromptEvent) {
            installPromptEvent.prompt();
            const { outcome: choice } = await installPromptEvent.userChoice;
            if (choice === 'accepted') {
                cb();
                setUserChoice('accepted');
            } else {
                setUserChoice(choice);
            }
            setInstallPromptEvent(null);
        }
    };

    useEffect(() => {
        // TODO: Check if window is available
        // if (!isWindowAvailable()) return;

        const handleInstallPrompt = (event: Event) => {
            event.preventDefault();
            setInstallPromptEvent(event as InstallPromptEvent);
        };

        const handleAppInstallChoice = (choice: UserChoice) => {
            setUserChoice(choice);
        };

        const getRegistration = async () => {
            if ('serviceWorker' in navigator) {
                try {
                    const _registration = await navigator.serviceWorker.getRegistration();
                    setRegistration(_registration ?? null);
                } catch (err) {
                    console.error('Error getting service worker registration:', err);
                }
            } else {
                console.warn('Service Workers are not supported in this browser.');
            }
        };

        const handleControllerChange = () => {
            getRegistration();
        };

        window.addEventListener('beforeinstallprompt', handleInstallPrompt);
        window.addEventListener('appinstalled', () => handleAppInstallChoice('accepted'));

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
        }

        getRegistration();

        return () => {
            window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
            window.removeEventListener('appinstalled', () => handleAppInstallChoice('accepted'));

            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
            }
        };
    }, []);

    useEffect(() => {
        const updateFalse = { isUpdateAvailable: false, newWorker: null };

        if (!registration) {
            setSwUpdate(updateFalse);
            setUpdateAvailable(false);
            return;
        }

        const handleUpdateFound = () => {
            const newWorker = registration.installing;
            if (newWorker) {
                const handleStateChange = () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        setSwUpdate({ isUpdateAvailable: true, newWorker });
                        setUpdateAvailable(true);
                    }
                };
                newWorker.addEventListener('statechange', handleStateChange);
            }
        };

        registration.addEventListener('updatefound', handleUpdateFound);

        return () => {
            registration.removeEventListener('updatefound', handleUpdateFound);
            setSwUpdate(updateFalse);
            setUpdateAvailable(false);
        };
    }, [registration]);

    return {
        updateAvailable,
        swUpdate,
        promptInstall,
        swRegistration: registration,
        userInstallChoice: userChoice,
    };
};