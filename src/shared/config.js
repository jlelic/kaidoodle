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
Config.POWER_UP_TO_RANDOM_PLAYER_CHANCE = 0.5;
Config.POWER_UP_TIME_LEFT_LIMIT = 20;

Config.MIN_PLAYER_COUNT_STATISTICS = 4;

Config.RECORD_FASTEST_GUESS = 'FASTEST_GUESS';
Config.RECORD_FASTEST_FULLY_GUESSED = 'FASTEST_FULLY_GUESSED';
Config.RECORD_TYPES = [
  Config.RECORD_FASTEST_GUESS,
  Config.RECORD_FASTEST_FULLY_GUESSED
];

const powerUps = {
  blackout: {
    name: "Blackout",
    duration: 8,
    description: `Hide the drawing for all other guessing players for 8 seconds.`,
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
  rainbow: {
    name: "Rainbow",
    description: "Continuously shift colors of the drawing for other guessing players for the rest of the round.",
    message: "Taste the rainbow 🌈👅"
  },
  gray: {
    name: "50 Shades of Gray",
    description: "Make the drawing black & white for other guessing players for the rest of the round.",
    message: "Vintage mode activated 📽🎞"
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
  },
  stretch: {
    name: "Stretch",
    description: "Show word as if it was 18 characters long for other guessing players.",
    message: "The word has been stretched"
  },
  noHint: {
    name: "No Hint",
    description: "Disable letter hints for other players.",
    message: "No hints are available this turn"
  },
  sabotage: {
    name: "Sabotage",
    self: true,
    duration: 3,
    description: "Allows you to draw with basic brush with medium width for the next 3 seconds."
  },
  flashlight: {
    name: "Flashlight",
    duration: 15,
    message: "Apagando las luces! Quick, use the flashlight! 🔦💡",
    description: "Reduce visible area for other guessing players for 15 seconds."
  }
};
Object.keys(powerUps).forEach(id => powerUps[id].id = id);
Config.POWER_UPS = powerUps;


module.exports = Config;
