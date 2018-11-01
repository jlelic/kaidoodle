const Config = {};

Config.SERVER_CHAT_NAME = '/server';
Config.ADMIN_COMMAND_PREFIX = '/';
Config.STRING_ARRAY_DELIMITER = ',';

Config.TIME_ROUND_BASE = 80;
Config.TIME_ROUND_REDUCTION = 5;
Config.TIME_ROUND_MINIMUM = 10;
Config.TIME_ROUND_HINT_START = 30;
Config.TIME_WORD_CHOOSE = 20;
Config.TIME_COOLDOWN = 5;

Config.SCORE_NO_CORRECT_GUESSES = -10;
Config.SCORE_BONUS_FIRST = 4;
Config.SCORE_BONUS_MAX = 6;
Config.SCORE_BONUS_REDUCTION = 1;
Config.SCORE_TIME_MULTIPLIER = 0.5;
Config.SCORE_TIME_MAXIMUM = 30;
Config.SCORE_BASE = 10;

Config.MAX_ROUNDS = 3;

Config.MAX_POWER_UPS = 3;
Config.POWER_UP_CHANCE = 1;
Config.POWER_UP_TO_RANDOM_PLAYER_CHANCE = 0.3;
Config.POWER_UP_TIME_LEFT_LIMIT = 20;

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
    description: `Apply blur effect on the drawing for all other guessing players for 15 seconds.`,
    message: `Looks like someone needs glasses 🔍🤓`
  },
  silence: {
    name: "Silence",
    duration: 8,
    description: `Disable chat for all other guessing players for 8 seconds.`,
    message: "Shhhh 🤫🤐"
  },
  hide: {
    name: "Hide",
    description: "Hide the word hint for all other guessing players for the rest of the round.",
    message: "The word was hidden! 🌫😈"
  },
  rainbow: {
    name: "Rainbow",
    description: "Continuously shift colors of the drawing for other guessing players for the rest of the round.",
    message: "Taste the rainbow 🌈👅"
  },
  gray: {
    name: "50 Shades of Gray",
    description: "Make the drawing black & white for other guessing players for the rest of the round.",
    message: "Artistic mode activated 📽🎞"
  },
  reveal: {
    name: "Reveal",
    description: "Reveal first letter of the word (it will be visible only to you).",
    self: true
  },
  double: {
    name: "Double Bonus",
    description: "After activating, your next guess will give you double points if it is correct. This effect does not stack. Bonus points are not counted towards the drawing player's reward.",
    self: true
  },
  fakeGuess: {
    name: "Fake Guess",
    description: "Send a message to other players that you correctly guessed the word.",
    self: true
  }
};
Object.keys(powerUps).forEach(id => powerUps[id].id = id);
Config.POWER_UPS = powerUps;


module.exports = Config;
