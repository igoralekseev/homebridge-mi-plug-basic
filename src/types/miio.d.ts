declare module 'miio' {
  export function device(config: MiioDeviceConfig): Promise<any>;
}

interface MiioDeviceConfig {
  address: string,
  token: string,
}


