
import React, { useState, useEffect } from 'react';

interface ToastProps {
    message: string;
}

const Toast: React.FC<ToastProps> = ({ message }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (message) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
            }, 2800);
            return () => clearTimeout(timer);
        }
    }, [message]);

    return (
        <div
            className={`fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-white font-semibold shadow-lg transition-all duration-300 ${
                visible ? 'opacity-100 translate-y-0 bg-gray-800 dark:bg-gray-200 dark:text-gray-900' : 'opacity-0 translate-y-5'
            }`}
        >
            {message}
        </div>
    );
};

export default Toast;
