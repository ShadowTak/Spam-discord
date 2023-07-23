const Discord = require('discord.js');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const axios = require('axios');
require('events').EventEmitter.defaultMaxListeners = 15;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
  });
} else {
  const client = new Discord.Client();
  client.setMaxListeners(15);
  client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    fetchProxyList();
  });

  async function fetchProxyList() {
    try {
      const proxyListUrl = 'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt';
      const response = await axios.get(proxyListUrl);
      const proxyList = response.data.split('\n');

      console.log('Proxy Count:', proxyList.length);


///////////////////////////////////////////
      const guildId = '1118680830789820467'; //
      const baseChannelName = 'Shadow|';
//////////////////////////////////////////      

      const numberOfChannels = proxyList.length;
      const delayBetweenChannels = 0;

      const guild = client.guilds.cache.get(guildId);
      if (!guild) {
        console.log(`Cannot find guild with ID ${guildId}`);
        return;
      }

      deleteAllChannels(guild)
        .then(() => {
          createChannelsSequentially(guild, baseChannelName, numberOfChannels, delayBetweenChannels, proxyList);
        })
        .catch(console.error);
    } catch (error) {
      console.error('Failed to fetch proxy list:', error.message);
    }
  }

  async function deleteAllChannels(guild) {
    const channels = guild.channels.cache;

    const deletePromises = channels.map(channel => channel.delete('Deleting all channels'));

    await Promise.all(deletePromises);

    console.log(`Deleted ${channels.size} channels`);
  }

  async function createChannelsSequentially(guild, baseChannelName, numberOfChannels, delayBetweenChannels, proxyList) {
    for (let i = 0; i < numberOfChannels; i++) {
      const randomLetters = generateRandomLetters(5);
      const channelName = `${baseChannelName} ${randomLetters}`;

      const proxy = proxyList[i];
      const proxyConfig = {
        httpAgent: new (require('http').Agent)({ keepAlive: true, keepAliveMsecs: 10000, timeout: 30000, proxy }),
        httpsAgent: new (require('https').Agent)({ keepAlive: true, keepAliveMsecs: 10000, timeout: 30000, proxy })
      };

      await createChannelWithDelay(guild, channelName, delayBetweenChannels, proxyConfig);
    }
  }

  function createChannelWithDelay(guild, channelName, delay, proxyConfig) {
    return new Promise(resolve => {
      setTimeout(() => {
        guild.channels
          .create(channelName, { type: 'text' }, null, null, 'Creating channel with proxy', proxyConfig)
          .then(channel => {
            console.log(`Created new channel: ${channel.name}`);
            resolve();
          })
          .catch(console.error);
      }, delay);
    });
  }

  function generateRandomLetters(length) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * letters.length);
      result += letters.charAt(randomIndex);
    }

    return result;
  }

  client.login('MTEyMjEwNzk4MjA3MTc0NjU4M'); // แทน YOUR_DISCORD_BOT_TOKEN ด้วยโทเค็นของบอท Discord

  console.log(`Worker ${process.pid} started`);
}

process.on('uncaughtException', function (err) {});
process.on('unhandledRejection', function (err) {});
