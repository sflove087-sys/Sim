import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

// TypeScript declaration for the Tawk_API object that will be available on the window
// FIX: Use Partial<> to allow for progressive initialization of the Tawk_API object.
// The Tawk.to script initializes an empty object first, which this change accommodates.
declare global {
    interface Window {
        Tawk_API: Partial<{
            onLoad: () => void;
            setAttributes: (attributes: object, callback: (error?: any) => void) => void;
            hideWidget: () => void;
            showWidget: () => void;
            toggle: () => void;
        }>;
    }
}

const LiveChatWidget: React.FC = () => {
    const { user } = useAuth();

    useEffect(() => {
        // Initialize the Tawk_API object
        window.Tawk_API = window.Tawk_API || {};

        // Define the onLoad callback to set user attributes once the widget is loaded
        window.Tawk_API.onLoad = () => {
            if (user) {
                // FIX: Use non-null assertion. By the time onLoad is called by the Tawk.to script,
                // the setAttributes method is guaranteed to be available.
                window.Tawk_API.setAttributes!({
                    'name': user.name,
                    'email': user.email,
                    'id': user.id,
                }, (error) => {
                    if (error) {
                        console.error('Tawk.to setAttributes error:', error);
                    }
                });
            }
        };

        // Create a script element to load the Tawk.to widget
        const tawkScript = document.createElement("script");
        tawkScript.async = true;
        // This is a placeholder/example ID. Replace with your actual Tawk.to Property_ID and Widget_ID.
        tawkScript.src = 'https://embed.tawk.to/667d40369d7f358570d306b8/1i1bnk8g8';
        tawkScript.charset = 'UTF-8';
        tawkScript.setAttribute('crossorigin', '*');
        
        // Append the script to the document head to start loading the widget
        document.head.appendChild(tawkScript);

        // Cleanup function that runs when the component unmounts
        return () => {
            const script = document.querySelector(`script[src="${tawkScript.src}"]`);
            if (script) {
                document.head.removeChild(script);
            }
            // Clean up any global variables or event listeners added by the script
            // This is a basic cleanup; a robust solution might need more from the Tawk.to API
            delete (window as any).Tawk_API;
            // Additional cleanup might be needed to remove the widget from the DOM
        };
    }, [user]); // This effect re-runs if the user object changes (e.g., on login/logout).

    // This component does not render any visible elements itself.
    // The Tawk.to script will inject the chat widget into the DOM.
    return null;
};

export default LiveChatWidget;
