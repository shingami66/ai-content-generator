import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';
import { userAPI } from '../api/api';

export const usePaymentSuccess = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { setUser } = useAppContext();
    const [isProcessing, setIsProcessing] = useState(false);
    const processingRef = useRef(false);

    useEffect(() => {
        const success = searchParams.get('success');

        // If no success param, or already processing, do nothing
        if (!success || processingRef.current) return;

        processingRef.current = true;
        setIsProcessing(true);

        // prevent duplicate toasts
        const toastId = toast.loading('Verifying payment status...');

        const checkStatus = async () => {
            try {
                // Trigger verification on backend first
                const sessionId = searchParams.get('session_id');
                if (sessionId) {
                    try {
                        const { subscriptionAPI } = await import('../api/api');
                        await subscriptionAPI.verifySession(sessionId);
                    } catch (e) {
                        console.error('Verification trigger failed', e);
                        // Continue polling anyway, maybe webhook handled it
                    }
                }

                let attempts = 0;
                const maxAttempts = 10;

                const intervalId = setInterval(async () => {
                    attempts++;
                    try {
                        // Use getCurrentProfile which relies on the token, not the local user state
                        const response = await userAPI.getCurrentProfile();

                        // Check if subscription updated
                        if (response.success && response.user &&
                            (response.user.subscriptionType === 'pro' || response.user.subscriptionType === 'premium')) {

                            clearInterval(intervalId);
                            setUser(response.user);
                            toast.success(`Plan updated to ${response.user.subscriptionType.toUpperCase()}!`, { id: toastId });

                            // Remove success param
                            setSearchParams(params => {
                                params.delete('success');
                                params.delete('session_id');
                                return params;
                            });
                            setIsProcessing(false);
                            processingRef.current = false;
                        } else if (attempts >= maxAttempts) {
                            clearInterval(intervalId);
                            toast.error('Sync timed out. Please refresh page.', { id: toastId });
                            setIsProcessing(false);
                            processingRef.current = false;
                        }
                    } catch (err) {
                        console.error('Polling error:', err);
                    }
                }, 1000);

            } catch (err) {
                console.error('Payment sync error:', err);
                toast.error('Failed to sync payment status.', { id: toastId });
                processingRef.current = false;
            }
        };

        checkStatus();

    }, [searchParams, setUser, setSearchParams]);

    return isProcessing;
};

// Add a simple Overlay component export or usage instruction if needed.
// But since this is a hook, it updates state.
// To make it show a UI, we should probably return the state and let the component render it,
// OR we can use the existing LoadingOverlay from context if we can access setIsGenerating?
// But "isGenerating" is specific.
// Let's return the `isProcessing` state from the hook so SubscriptionPage can render it.

