const Config = {};

const powerUps = {
  blackout: {
    name: "Blackout",
    duration: 10,
    description: `Hide the drawing for all other guessing players for 10 seconds.`,
    message: `YOU JUST GOT BLACKED! 👨🏿🍆`,
  },
  blur: {
    name: "Blur",
    duration: 15,
    description: `Apply blur filter on the drawing for all other guessing players for 15 seconds.`,
    message: `Looks like someone needs glasses 🔍🤓`
  },
  silence: {
    name: "Silence",
    duration: 10,
    description: `Disable chat for all other guessing players for 10 seconds.`,
    message: "Shhhh 🤫🤐"
  },
  hide: {
    name: "Hide",
    duration: 200,
    description: "Hide the word hint for all other guessing players for the rest of the round.",
    message: "How many letters was it again? 🌫😈"
  }
};
Object.keys(powerUps).forEach(id => powerUps[id].id = id);
Config.POWER_UPS = powerUps;

module.exports = Config;
