declare module "node-zalo-bot" {
  export default class ZaloBot {
    constructor(token: string, options?: any);
    sendMessage(chatId: string, text: string, options?: any): Promise<any>;
    setWebHook(url: string, secretToken?: string, options?: any): Promise<any>;
    deleteWebHook(): Promise<any>;
    getWebHookInfo(): Promise<any>;
    getMe(): Promise<any>;
    startPolling(options?: any): void;
    on(event: string, listener: (...args: any[]) => void): this;
    onText(regexp: RegExp, callback: (msg: any, match: any) => void): void;
  }
}
