type PostMessageCallback = (type: 'client' | 'server', event: string, data: object) => void;
