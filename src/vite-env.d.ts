/// <reference types="vite/client" />

declare namespace google {
    namespace accounts {
        namespace id {
            function initialize(config: any): void;
            function renderButton(element: HTMLElement, options: any): void;
            function prompt(notification?: (notification: any) => void): void;
        }
        namespace oauth2 {
            function initTokenClient(config: TokenClientConfig): TokenClient;
            function revoke(token: string, callback: () => void): void;

            interface TokenClient {
                requestAccessToken: (overrideConfig?: { prompt: string }) => void;
            }

            interface TokenClientConfig {
                client_id: string;
                scope: string;
                callback: (tokenResponse: TokenResponse) => void;
            }

            interface TokenResponse {
                access_token: string;
            }
        }
    }
}
