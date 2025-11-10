/// <reference types="vite/client" />

declare namespace google {
    namespace accounts {
        namespace oauth2 {
            function initTokenClient(config: TokenClientConfig): TokenClient;
            function revoke(token: string, callback: () => void): void;

            interface TokenClient {
                requestAccessToken: () => void;
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
