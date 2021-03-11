"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
const miio_1 = __importDefault(require("miio"));
const t = __importStar(require("io-ts"));
const PathReporter_1 = require("io-ts/PathReporter");
const Either_1 = require("fp-ts/lib/Either");
let hap;
const ACCESSORY_NAME = 'MiSmartPlug';
const PowerSwitchConfig = t.type({
    name: t.string,
    token: t.string,
    address: t.string,
});
const getRight = (v, errorMessage) => {
    if (Either_1.isLeft(v)) {
        throw new Error(`${errorMessage}${PathReporter_1.PathReporter.report(v)}`);
    }
    return v.right;
};
class PowerSwitch {
    constructor(log, config, api) {
        this.config = getRight(PowerSwitchConfig.decode(config), `${ACCESSORY_NAME} wrong config:`);
        this.log = log;
        this.name = config.name;
        this.miioDevice = miio_1.default.device({ address: config.address, token: config.token });
        this.miioDevice
            .then(device => log.info(`${ACCESSORY_NAME} finished initializing!`, device))
            .catch((error) => log.error(`${ACCESSORY_NAME} initialization failed:`, error));
        this.switchService = new hap.Service.Switch(this.name);
        this.switchService.getCharacteristic(hap.Characteristic.On)
            .on("get" /* GET */, (callback) => {
            this.miioDevice
                .then(device => device.power())
                .then(isOn => {
                log.info(`Current state of the switch was returned: ${isOn ? 'ON' : 'OFF'}`);
                callback(undefined, isOn);
            });
        })
            .on("set" /* SET */, (value, callback) => {
            this.miioDevice
                .then(device => device.changePower(value))
                .then(device => device.power())
                .then(isOn => {
                log.info(`Switch state was set to: ${isOn ? 'ON' : 'OFF'}`);
                callback();
            });
        });
        this.informationService = new hap.Service.AccessoryInformation()
            .setCharacteristic(hap.Characteristic.Manufacturer, 'Xiaomi')
            .setCharacteristic(hap.Characteristic.Model, ACCESSORY_NAME);
    }
    getServices() {
        return [
            this.informationService,
            this.switchService,
        ];
    }
}
module.exports = (api) => {
    hap = api.hap;
    api.registerAccessory(ACCESSORY_NAME, PowerSwitch);
};
//# sourceMappingURL=accessory.js.map