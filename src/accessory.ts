import {
  AccessoryConfig,
  AccessoryPlugin,
  API,
  CharacteristicEventTypes,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
  HAP,
  Logging,
  Service
} from 'homebridge';

import miio from 'miio';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/PathReporter'
import { isLeft } from 'fp-ts/lib/Either';

let hap: HAP;

const ACCESSORY_NAME = 'MiSmartPlug';

export = (api: API) => {
  hap = api.hap;
  api.registerAccessory(ACCESSORY_NAME, PowerSwitch);
};

const PowerSwitchConfig = t.type({
  name: t.string,
  token: t.string,
  address: t.string,
});

const getRight = <A>(v: t.Validation<A>, errorMessage: string): A => {
  if (isLeft(v)) { throw new Error(`${errorMessage}${PathReporter.report(v)}`) }
  return v.right;
}

class PowerSwitch implements AccessoryPlugin {

  private readonly log: Logging;
  private readonly name: string;
  private readonly config: t.TypeOf<typeof PowerSwitchConfig>

  private readonly switchService: Service;
  private readonly informationService: Service;
  private readonly miioDevice: Promise<any>;

  constructor(log: Logging, config: AccessoryConfig, api: API) {
    this.config = getRight(PowerSwitchConfig.decode(config), `${ACCESSORY_NAME} wrong config:`);

    this.log = log;
    this.name = config.name;

    this.miioDevice = miio.device({ address: config.address, token: config.token });

    this.miioDevice
      .then(device => log.debug(`${ACCESSORY_NAME} finished initializing!`, device))
      .catch((error: unknown) => log.debug(`${ACCESSORY_NAME} initialization failed:`, error));

    this.switchService = new hap.Service.Switch(this.name);
    this.switchService.getCharacteristic(hap.Characteristic.On)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        this.miioDevice
          .then(device => {
            const isOn = device.property('power');
            log.debug(`Current state of the switch was returned: ${isOn? 'ON': 'OFF' }`);
            callback(undefined, isOn);
          });
      })
      .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        this.miioDevice
          .then(device => {
            device.changePower(value);
            const isOn = device.property('power');
            log.debug(`Switch state was set to: ${isOn? 'ON': 'OFF' }`);
            callback();
          });
      });

    this.informationService = new hap.Service.AccessoryInformation()
      .setCharacteristic(hap.Characteristic.Manufacturer, 'Xiaomi')
      .setCharacteristic(hap.Characteristic.Model, ACCESSORY_NAME);

  }

  getServices(): Service[] {
    return [
      this.informationService,
      this.switchService,
    ];
  }
}
