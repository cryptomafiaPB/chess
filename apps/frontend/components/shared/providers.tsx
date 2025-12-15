// src/components/shared/providers.tsx
'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import {
    QueryClientProvider,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { getQueryClient } from '@/lib/query-client';
import { getSocketClient } from '@/lib/socket-client';
import { Socket } from 'socket.io-client';

type ProvidersProps = {
    children: ReactNode;
};

export const SocketContext = React.createContext<Socket | null>(null);

export function Providers({ children }: ProvidersProps) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const queryClient = getQueryClient();

    useEffect(() => {
        const client = getSocketClient();
        setSocket(client);
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <SocketContext.Provider value={socket}>
                {children}
            </SocketContext.Provider>
            {/* optional during dev */}
            {/* <ReactQueryDevtools initialIsOpen={false} /> */}
        </QueryClientProvider>
    );
}
