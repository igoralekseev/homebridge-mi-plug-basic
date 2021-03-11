declare module 'miio' {
  export function device(config: MiioDeviceConfig): Promise<MiioDevice>;
}

interface MiioDeviceConfig {
  address: string,
  token: string,
}

interface MiioDevice {
  get: (prop: string) => Promise<any>,
  set: (prop: string, value: any) => Promise<any>,
}
