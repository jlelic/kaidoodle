const Config = {};

Config.POWER_UPS = {
  blackout: {
    description: "blackout"
  },
  blur: {
    description: "blur"
  },
  mute: {
    description: "mute"
  },
  hide: {
    description: "hide"
  }
};
Object.keys(Config.POWER_UPS).forEach(id => Config.POWER_UPS[id].id = id);

module.exports = Config;
