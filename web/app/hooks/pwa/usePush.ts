import { useEffect, useState } from 'react';

type PushSubscriptionType = PushSubscription | null;
type ServiceWorkerRegistrationType = ServiceWorkerRegistration | null;
type PushPermissionState = 'granted' | 'denied' | 'default';

export const usePush = () => {
    const [swRegistration, setSWRegistration] = useState<ServiceWorkerRegistrationType>(null);
    const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
    const [pushSubscription, setPushSubscription] = useState<PushSubscriptionType>(null);
    const [canSendPush, setCanSendPush] = useState<boolean>(false);

    const requestPermission = async (): Promise<PushPermissionState> => {
        if (canSendPush) return 'granted';

        const permission = await Notification.requestPermission();
        setCanSendPush(permission === 'granted');
        return permission;
    };

    const subscribeToPush = async (
        publicKey: string,
        callback?: (subscription: PushSubscriptionType) => void,
        errorCallback?: (error: Error) => void
    ) => {
        if (!swRegistration) return;

        try {
            const subscription = await swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: publicKey,
            });
            setIsSubscribed(true);
            setPushSubscription(subscription);
            callback?.(subscription);
        } catch (error) {
            errorCallback?.(error as Error);
        }
    };

    const unsubscribeFromPush = async (
        callback?: () => void,
        errorCallback?: (error: Error) => void
    ) => {
        if (!swRegistration) return;

        try {
            const subscription = await swRegistration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
                setIsSubscribed(false);
                setPushSubscription(null);
                callback?.();
            }
        } catch (error) {
            errorCallback?.(error as Error);
        }
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const getRegistration = async () => {
            if ('serviceWorker' in navigator) {
                try {
                    const registration = await navigator.serviceWorker.getRegistration();
                    setSWRegistration(registration ?? null);
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

        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
        getRegistration();

        return () => {
            navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        };
    }, []);

    useEffect(() => {
        if (!swRegistration) return;

        const checkSubscription = async () => {
            const subscription = await swRegistration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
            setPushSubscription(subscription);
            setCanSendPush(Notification.permission === 'granted');
        };

        checkSubscription();
    }, [swRegistration]);

    return {
        isSubscribed,
        pushSubscription,
        requestPermission,
        subscribeToPush,
        unsubscribeFromPush,
        canSendPush,
    };
};